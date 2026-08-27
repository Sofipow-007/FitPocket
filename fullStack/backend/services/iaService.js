const Groq = require('groq-sdk')

const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

const call = (msgs, temp) => client.chat.completions.create({
  model: 'qwen/qwen3.6-27b',
  messages: msgs,
  temperature: temp,
  max_tokens: 3500,
  reasoning_effort: 'none'
})

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

const generarPlan = async (perfil) => {
  const dias = perfil.diasDispo.join(', ')

  const promptRutina = `Sos entrenador personal. Generá SOLO el "meta" y la "rutina" en JSON puro con esta estructura:
{"meta":{"objetivo":"","duracionSemanas":0,"caloriasObjetivoDia":0,"nivelDificultad":"","justificacion":"","tipoDieta":"","diasDisponibles":[],"minutosPorSesion":0,"presupuestoMensual":0},"rutina":[{"dia":"","tipo":"","duracionMinutos":0,"ejercicios":[{"nombre":"","series":0,"repeticiones":"","descansoSegundos":0,"nota":"","alternativas":[{"nombre":"","series":0,"repeticiones":"","descansoSegundos":0,"nota":""}]}]}]}

Datos:
- Peso: ${perfil.peso}kg, Altura: ${perfil.altura}cm, Edad: ${perfil.edad}, Sexo: ${perfil.sexo}
- Objetivo: ${perfil.objetivo}, Nivel: ${perfil.nivel}
- Días disponibles: ${dias} (solo estos días van en rutina)
- Minutos/sesión: ${perfil.minutosPorSesion}, Dieta: ${perfil.tipoDieta}
- Limitaciones: ${perfil.limitaciones.length ? perfil.limitaciones.join(', ') : 'ninguna'}

Solo los días disponibles en rutina. Máximo 2 alternativas por ejercicio. Solo JSON puro.`

  let res = await call([{ role: 'user', content: promptRutina }], 0.7)
  const parte1 = await parsearConRetry(promptRutina, limpiar(res.choices[0].message.content))

  const promptDieta = `Sos nutricionista. Generá SOLO la "dieta" de 7 días en JSON puro con esta estructura:
{"dieta":[{"dia":"","comida":{"desayuno":{"descripcion":"","calorias":0},"almuerzo":{"descripcion":"","calorias":0},"merienda":{"descripcion":"","calorias":0},"cena":{"descripcion":"","calorias":0}},"costoEstimadoDia":0}]}

Datos:
- Objetivo: ${perfil.objetivo}, Tipo de dieta: ${perfil.tipoDieta}
- Calorías objetivo/día: ${parte1.meta.caloriasObjetivoDia}
- Presupuesto: $${perfil.presupuesto}/mes
- Limitaciones: ${perfil.limitaciones.length ? perfil.limitaciones.join(', ') : 'ninguna'}

Los 7 días de la semana. Solo JSON puro.`

  res = await call([{ role: 'user', content: promptDieta }], 0.7)
  const parte2 = await parsearConRetry(promptDieta, limpiar(res.choices[0].message.content))

  return {
    meta:   parte1.meta,
    rutina: parte1.rutina,
    dieta:  parte2.dieta
  }
}

module.exports = { generarPlan }