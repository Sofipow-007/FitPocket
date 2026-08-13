const Groq = require('groq-sdk')

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

const generarPlan = async (perfil) => {

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
    "tipoDieta": "string",
    "diasDisponibles": ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
    "minutosPorSesion": número,
    "presupuestoMensual": número
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
          "nota": "string",
          "alternativas": [
            {
              "nombre": "string",
              "series": número,
              "repeticiones": "string",
              "descansoSegundos": número,
              "nota": "string"
            }
          ]
        }
      ]
    }
  ],
  "dieta": [
    {
      "dia": "Lunes",
      "comida": {
        "desayuno": { "descripcion": "string", "calorias": número },
        "almuerzo": { "descripcion": "string", "calorias": número },
        "merienda": { "descripcion": "string", "calorias": número },
        "cena": { "descripcion": "string", "calorias": número }
      },
      "costoEstimadoDia": número
    }
  ]
}

La rutina y la dieta deben tener los 7 días de la semana.
Los días que el usuario no entrena, el campo ejercicios va vacío [].

Para cada ejercicio, incluí 1 o 2 "alternativas": ejercicios que trabajen el
mismo grupo muscular y sirvan para el mismo objetivo, para que el usuario
pueda reemplazarlo si no tiene el equipo o prefiere variar. Si no se te
ocurre una alternativa razonable, dejá el array vacío [].
`

  let completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 4096
  })

  let texto = completion.choices[0].message.content

  texto = texto
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim()

  let plan
  try {
    plan = JSON.parse(texto)
  } catch (e) {
    console.log('JSON inválido, reintentando...')

    completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'user', content: prompt },
        { role: 'assistant', content: texto },
        { role: 'user', content: 'El JSON que devolviste no es válido. Respondé solo con el JSON puro, sin ningún texto extra ni markdown.' }
      ],
      temperature: 0.3,
      max_tokens: 4096
    })

    texto = completion.choices[0].message.content
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    plan = JSON.parse(texto)
  }

  return plan
}

module.exports = { generarPlan }