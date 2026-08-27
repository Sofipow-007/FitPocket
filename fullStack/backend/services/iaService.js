const Groq = require('groq-sdk')

const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

const generarPlan = async (perfil) => {
  const dias = perfil.diasDispo.join(', ')

  const prompt = `Sos entrenador personal y nutricionista. Generá un plan en JSON puro (sin markdown) con esta estructura exacta:
{"meta":{"objetivo":"","duracionSemanas":0,"caloriasObjetivoDia":0,"nivelDificultad":"","justificacion":"","tipoDieta":"","diasDisponibles":[],"minutosPorSesion":0,"presupuestoMensual":0},"rutina":[{"dia":"","tipo":"","duracionMinutos":0,"ejercicios":[{"nombre":"","series":0,"repeticiones":"","descansoSegundos":0,"nota":"","alternativas":[]}]}],"dieta":[{"dia":"","comida":{"desayuno":{"descripcion":"","calorias":0},"almuerzo":{"descripcion":"","calorias":0},"merienda":{"descripcion":"","calorias":0},"cena":{"descripcion":"","calorias":0}},"costoEstimadoDia":0}]}

Datos del usuario:
- Peso: ${perfil.peso}kg, Altura: ${perfil.altura}cm, Edad: ${perfil.edad}, Sexo: ${perfil.sexo}
- Objetivo: ${perfil.objetivo}, Nivel: ${perfil.nivel}
- Días disponibles: ${dias} (solo estos días van en rutina)
- Minutos/sesión: ${perfil.minutosPorSesion}, Dieta: ${perfil.tipoDieta}
- Presupuesto: $${perfil.presupuesto}/mes
- Limitaciones: ${perfil.limitaciones.length ? perfil.limitaciones.join(', ') : 'ninguna'}

La dieta incluye los 7 días. La rutina solo los días disponibles. Máximo 2 alternativa por ejercicio. Solo JSON puro.`

  const call = (msgs, temp) => client.chat.completions.create({
    model: 'qwen/qwen3.6-27b',
    messages: msgs,
    temperature: temp,
    max_tokens: 3000
  })

  let res = await call([{ role: 'user', content: prompt }], 0.7)
  let texto = res.choices[0].message.content.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/```json/g, '').replace(/```/g, '').trim()

  try {
    return JSON.parse(texto)
  } catch {
    console.log('JSON inválido, reintentando...')
    res = await call([
      { role: 'user', content: prompt },
      { role: 'assistant', content: texto },
      { role: 'user', content: 'Devolvé solo el JSON puro, sin texto extra.' }
    ], 0.3)
    texto = res.choices[0].message.content.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/```json/g, '').replace(/```/g, '').trim()
    return JSON.parse(texto)
  }
}

module.exports = { generarPlan }