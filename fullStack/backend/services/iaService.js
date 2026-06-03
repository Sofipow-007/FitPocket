const Anthropic = require('@anthropic-ai/sdk')

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
})

const generarPlan = async (perfil) => {

  // arma el prompt con todos los datos del perfil
  const prompt = `
Sos un entrenador personal y nutricionista experto.
Generá un plan de entrenamiento y alimentación personalizado
basado en los siguientes datos del usuario:

- Peso: ${perfil.peso} kg
- Altura: ${perfil.altura} cm
- Edad: ${perfil.edad} años
- Sexo: ${perfil.sexo}
- Objetivo: ${perfil.objetivo}
- Nivel de experiencia: ${perfil.nivel}
- Días disponibles: ${perfil.diasDispo.join(', ')}
- Minutos por sesión: ${perfil.minutosPorSesion}
- Tipo de dieta: ${perfil.tipoDieta}
- Presupuesto mensual para comida: $${perfil.presupuesto}
- Limitaciones físicas: ${perfil.limitaciones.length > 0 ? perfil.limitaciones.join(', ') : 'ninguna'}

Respondé ÚNICAMENTE con un JSON válido, sin texto adicional,
sin markdown, sin bloques de código. Solo el JSON puro.

El JSON debe tener exactamente esta estructura:
{
  "meta": {
    "objetivo": "string",
    "duracionSemanas": número,
    "caloriasObjetivoDia": número,
    "nivelDificultad": "principiante|intermedio|avanzado",
    "justificacion": "string explicando el plan"
  },
  "rutina": [
    {
      "dia": "Lunes",
      "tipo": "string",
      "duracionMinutos": número,
      "ejercicios": [
        {
          "nombre": "string",
          "series": número,
          "repeticiones": "string",
          "descansoSegundos": número,
          "nota": "string"
        }
      ]
    }
  ],
  "dieta": [
    {
      "dia": "Lunes",
      "desayuno": { "descripcion": "string", "calorias": número },
      "almuerzo": { "descripcion": "string", "calorias": número },
      "merienda": { "descripcion": "string", "calorias": número },
      "cena": { "descripcion": "string", "calorias": número },
      "costoEstimadoDia": número
    }
  ]
}

La rutina y la dieta deben tener los 7 días de la semana.
Los días que el usuario no entrena, el campo ejercicios va vacío [].
`

  // primera llamada a Claude
  let respuesta = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }]
  })

  let texto = respuesta.content[0].text

  // limpiar markdown si Claude lo incluyó igual
  texto = texto
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim()

  // intentar parsear — si falla, reintentar una vez
  let plan
  try {
    plan = JSON.parse(texto)
  } catch (e) {
    console.log('JSON inválido, reintentando...')

    // segundo intento con instrucción más estricta
    respuesta = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        { role: 'user', content: prompt },
        { role: 'assistant', content: texto },
        { role: 'user', content: 'El JSON que devolviste no es válido. Respondé solo con el JSON puro, sin ningún texto extra.' }
      ]
    })

    texto = respuesta.content[0].text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    plan = JSON.parse(texto) // si falla de nuevo, lanza el error
  }

  return plan
}

module.exports = { generarPlan }