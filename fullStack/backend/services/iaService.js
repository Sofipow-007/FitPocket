const Groq = require('groq-sdk')

const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

// El plan gratuito de Groq permite 8000 tokens por minuto y un plan gasta ~4000:
// con dos o tres usuarios a la vez Groq responde 429. En vez de mostrarle el error
// al usuario, se espera lo que Groq indica y se vuelve a pedir.
const ESPERA_TOTAL_MAX_MS = 90000
const ESPERA_POR_INTENTO_MAX_MS = 30000
const esperar = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const segundosDeEspera = (error) => {
  const headers = error?.headers
  const valor = typeof headers?.get === 'function' ? headers.get('retry-after') : headers?.['retry-after']
  const segundos = Number(valor)
  return Number.isFinite(segundos) && segundos > 0 ? segundos : 15
}

// "Request too large" también llega como 429, pero esperar no lo arregla.
const esLimitePorMinuto = (error) => error?.status === 429 && !/too large/i.test(error?.message || '')

const call = async (msgs, temp) => {
  let esperado = 0
  for (;;) {
    try {
      return await client.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        messages: msgs,
        temperature: temp,
        max_tokens: 3500,
        reasoning_effort: 'low'
      })
    } catch (error) {
      const ms = Math.min(segundosDeEspera(error) * 1000 + 500, ESPERA_POR_INTENTO_MAX_MS)
      if (!esLimitePorMinuto(error) || esperado + ms > ESPERA_TOTAL_MAX_MS) throw error
      console.log(`Groq al límite de tokens por minuto, reintentando en ${Math.round(ms / 1000)} s...`)
      esperado += ms
      await esperar(ms)
    }
  }
}

const limpiar = (texto) => texto
  .replace(/<think>[\s\S]*?<\/think>/g, '')
  .replace(/```json/g, '')
  .replace(/```/g, '')
  .trim()

const parsearConRetry = async (prompt, textoInicial) => {
  try {
    return JSON.parse(textoInicial)
  } catch {
    console.log('JSON inválido, reintentando...')
    const res = await call([
      { role: 'user', content: prompt + '\n\nIMPORTANTE: Respondé ÚNICAMENTE con el JSON, sin ningún texto antes ni después.' }
    ], 0.3)
    return JSON.parse(limpiar(res.choices[0].message.content))
  }
}

// Qué significa cada limitación en términos de ejercicios. El modelo solo recibía
// la palabra ("lumbar") y decidía por su cuenta qué era contraindicado.
const CONTRAINDICACIONES = {
  lumbar:       'sin saltos ni impacto, sin peso muerto convencional ni buenos días, sin sentadilla con carga pesada sobre la espalda, sin abdominales con flexión de tronco cargada',
  rodilla:      'sin saltos ni impacto, sin sentadilla profunda, sin zancadas con salto, sin extensión de cuádriceps pesada, sin carrera',
  hombro:       'sin press por encima de la cabeza pesado, sin fondos en paralelas, sin press tras nuca, sin elevaciones laterales pesadas',
  asma:         'calentamiento progresivo, sin intervalos de intensidad máxima, descansos completos entre series',
  hipertension: 'sin HIIT ni intervalos de intensidad máxima, sin cargas máximas ni series al fallo, sin isométricos sostenidos, sin ejercicios con la cabeza por debajo del corazón'
}

const reglasDeLimitaciones = (limitaciones) => limitaciones
  .filter(l => CONTRAINDICACIONES[l])
  .map(l => `- ${l}: ${CONTRAINDICACIONES[l]}`)
  .join('\n')

const generarPlan = async (perfil) => {
  const dias = perfil.diasDispo.join(', ')
  const reglas = reglasDeLimitaciones(perfil.limitaciones)
  // las claves y los nombres de los días van siempre en español: el resto de la app los usa para ubicar cada día
  const idioma = perfil.idioma === 'en'
    ? '\nEscribí en inglés todos los textos (nombres de ejercicios, tipo, nota, objetivo, justificación, descripciones de comidas). Los valores de "dia" van siempre en español y en minúsculas.'
    : ''

  const promptRutina = `Sos entrenador personal. Generá SOLO el "meta" y la "rutina" en JSON puro con esta estructura:
{"meta":{"objetivo":"","duracionSemanas":0,"caloriasObjetivoDia":0,"nivelDificultad":"","justificacion":"","tipoDieta":"","diasDisponibles":[],"minutosPorSesion":0,"presupuestoMensual":0},"rutina":[{"dia":"","tipo":"","duracionMinutos":0,"ejercicios":[{"nombre":"","series":0,"repeticiones":"","descansoSegundos":0,"nota":"","alternativas":[{"nombre":"","series":0,"repeticiones":"","descansoSegundos":0,"nota":""}]}]}]}

Datos:
- Peso: ${perfil.peso}kg, Altura: ${perfil.altura}cm, Edad: ${perfil.edad}, Sexo: ${perfil.sexo}
- Objetivo: ${perfil.objetivo}, Nivel: ${perfil.nivel}
- Días disponibles: ${dias} (solo estos días van en rutina)
- Minutos/sesión: ${perfil.minutosPorSesion}, Dieta: ${perfil.tipoDieta}
- Limitaciones: ${perfil.limitaciones.length ? perfil.limitaciones.join(', ') : 'ninguna'}
- Aclaración del usuario: ${perfil.aclaracion || 'ninguna'}

No incluyas ejercicios contraindicados para las limitaciones indicadas, ni como ejercicio principal ni como alternativa.${reglas ? `
Reglas obligatorias por limitación:
${reglas}` : ''}
La rutina tiene que tener exactamente estos días, uno por cada día disponible: ${dias}.${idioma}
Solo los días disponibles en rutina. Máximo 2 alternativas por ejercicio. Solo JSON puro, minificado en una sola línea, sin saltos de línea ni indentación.`

  let res = await call([{ role: 'user', content: promptRutina }], 0.7)
  const parte1 = await parsearConRetry(promptRutina, limpiar(res.choices[0].message.content))

  const promptDieta = `Sos nutricionista. Generá SOLO la "dieta" de 7 días en JSON puro con esta estructura:
{"dieta":[{"dia":"","comida":{"desayuno":{"descripcion":"","calorias":0},"almuerzo":{"descripcion":"","calorias":0},"merienda":{"descripcion":"","calorias":0},"cena":{"descripcion":"","calorias":0}},"costoEstimadoDia":0}]}

Datos:
- Objetivo: ${perfil.objetivo}, Tipo de dieta: ${perfil.tipoDieta}
- Calorías objetivo/día: ${parte1.meta.caloriasObjetivoDia}
- Presupuesto: $${perfil.presupuesto}/mes
- Limitaciones: ${perfil.limitaciones.length ? perfil.limitaciones.join(', ') : 'ninguna'}

Los 7 días de la semana, con "dia" en español (lunes a domingo).${idioma} Solo JSON puro, minificado en una sola línea, sin saltos de línea ni indentación.`

  res = await call([{ role: 'user', content: promptDieta }], 0.7)
  const parte2 = await parsearConRetry(promptDieta, limpiar(res.choices[0].message.content))

  return {
    meta:   parte1.meta,
    rutina: parte1.rutina,
    dieta:  parte2.dieta
  }
}

module.exports = { generarPlan }