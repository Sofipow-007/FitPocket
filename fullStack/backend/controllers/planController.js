const Plan = require('../models/Plan')
const User = require('../models/User')
// const { dispararPlan } = require('../services/webhookService')

// función interna que arma el plan según el perfil
// generación manual de prueba antes de automatizar con IA
const armarPlanMock = (perfil) => {
  const diasEntrenamiento = perfil.diasDispo || perfil.diasDisponibles || []
  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
  const objetivo = perfil.objetivo || 'salud general'
  const nivel = perfil.nivel || 'principiante'
  const minutosSesion = perfil.minutosPorSesion || 45
  const presupuesto = perfil.presupuesto || 15000
  const tipoDieta = perfil.tipoDieta || 'normal'
  const limitaciones = perfil.limitaciones || []

  const ejerciciosPorObjetivo = {
    'perder grasa': [
      { nombre: 'Sentadilla', series: 3, repeticiones: '15', descansoSegundos: 45, nota: 'Controlá la bajada' },
      { nombre: 'Plancha', series: 3, repeticiones: '30 segundos', descansoSegundos: 30, nota: '' },
      { nombre: 'Burpees', series: 3, repeticiones: '12', descansoSegundos: 60, nota: 'Mantené el ritmo' }
    ],
    'ganar músculo': [
      { nombre: 'Press de banca', series: 4, repeticiones: '8', descansoSegundos: 90, nota: 'Peso progresivo' },
      { nombre: 'Remo con barra', series: 4, repeticiones: '8', descansoSegundos: 90, nota: '' },
      { nombre: 'Sentadilla con peso', series: 4, repeticiones: '10', descansoSegundos: 90, nota: 'Espalda recta' }
    ],
    'resistencia': [
      { nombre: 'Trote continuo', series: 1, repeticiones: '20 minutos', descansoSegundos: 0, nota: 'Ritmo constante' },
      { nombre: 'Saltos de soga', series: 3, repeticiones: '2 minutos', descansoSegundos: 30, nota: '' },
      { nombre: 'Bicicleta', series: 1, repeticiones: '15 minutos', descansoSegundos: 0, nota: '' }
    ],
    'salud general': [
      { nombre: 'Caminata rápida', series: 1, repeticiones: '30 minutos', descansoSegundos: 0, nota: '' },
      { nombre: 'Flexiones', series: 3, repeticiones: '10', descansoSegundos: 60, nota: 'A tu ritmo' },
      { nombre: 'Estiramiento', series: 1, repeticiones: '10 minutos', descansoSegundos: 0, nota: '' }
    ]
  }

  const limitacionesBajas = limitaciones.map(l => l.toLowerCase())
  let ejercicios = ejerciciosPorObjetivo[objetivo] || ejerciciosPorObjetivo['salud general']
  if (limitacionesBajas.includes('espalda baja') || limitacionesBajas.includes('lumbar')) {
    ejercicios = ejercicios.filter(e => !['Remo con barra', 'Sentadilla con peso'].includes(e.nombre))
  }
  if (limitacionesBajas.includes('rodilla')) {
    ejercicios = ejercicios.filter(e => !['Sentadilla', 'Burpees', 'Saltos de soga'].includes(e.nombre))
  }

  const rutina = diasSemana.map(dia => {
    const diaMinuscula = dia.toLowerCase()
      .replace('é', 'e').replace('á', 'a')
    const entrena = diasEntrenamiento.some(d =>
      d.toLowerCase().replace('é', 'e').replace('á', 'a') === diaMinuscula
    )
    return {
      dia,
      tipo: entrena ? `Entrenamiento — ${objetivo}` : 'Descanso',
      duracionMinutos: entrena ? minutosSesion : 0,
      ejercicios: entrena ? ejercicios : []
    }
  })

  const comidasPorDieta = {
    'normal': {
      desayuno: { descripcion: 'Avena con leche y banana', calorias: 350 },
      almuerzo: { descripcion: 'Pechuga de pollo con arroz integral y ensalada', calorias: 550 },
      merienda: { descripcion: 'Yogur descremado con nueces', calorias: 200 },
      cena: { descripcion: 'Huevos revueltos con verduras salteadas', calorias: 400 }
    },
    'vegana': {
      desayuno: { descripcion: 'Smoothie de frutas con leche de avena', calorias: 300 },
      almuerzo: { descripcion: 'Lentejas con arroz y vegetales', calorias: 520 },
      merienda: { descripcion: 'Fruta de estación con mantequilla de maní', calorias: 220 },
      cena: { descripcion: 'Tofu salteado con brócoli y quinoa', calorias: 420 }
    },
    'vegetariana': {
      desayuno: { descripcion: 'Tostadas con huevo y tomate', calorias: 330 },
      almuerzo: { descripcion: 'Milanesa de soja con puré de calabaza', calorias: 510 },
      merienda: { descripcion: 'Queso cottage con frutas', calorias: 190 },
      cena: { descripcion: 'Omelette de vegetales con queso', calorias: 380 }
    },
    'keto': {
      desayuno: { descripcion: 'Huevos con bacon y palta', calorias: 420 },
      almuerzo: { descripcion: 'Salmón con espárragos y manteca', calorias: 580 },
      merienda: { descripcion: 'Nueces y queso en cubos', calorias: 250 },
      cena: { descripcion: 'Carne vacuna con ensalada verde y aceite de oliva', calorias: 500 }
    },
    'singluten': {
      desayuno: { descripcion: 'Tortilla de avena sin gluten con fruta', calorias: 330 },
      almuerzo: { descripcion: 'Pechuga de pollo con quinoa y vegetales', calorias: 540 },
      merienda: { descripcion: 'Yogur natural con semillas', calorias: 210 },
      cena: { descripcion: 'Merluza al horno con batata y ensalada', calorias: 430 }
    }
  }

  const comidas = comidasPorDieta[tipoDieta.toLowerCase()] || comidasPorDieta['normal']
  const caloriasTotal = Object.values(comidas).reduce((acc, c) => acc + c.calorias, 0)
  const costoDia = Math.round(presupuesto / 30)

  const dieta = diasSemana.map(dia => ({
    dia,
    ...comidas,
    costoEstimadoDia: costoDia
  }))

  return {
    meta: {
      objetivo,
      duracionSemanas: 4,
      caloriasObjetivoDia: caloriasTotal,
      nivelDificultad: nivel,
      justificacion: `Plan de ${objetivo} para ${perfil.sexo || 'persona'} de ${perfil.edad || 'edad'} años, ${perfil.peso || 'peso'} kg y ${perfil.altura || 'altura'} cm. ${diasEntrenamiento.length} días de entrenamiento de ${minutosSesion} minutos por sesión, con dieta ${tipoDieta} y presupuesto mensual de $${presupuesto}.`
    },
    rutina,
    dieta
  }
}

exports.generarPlan = async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) return res.status(401).json({ error: 'Token inválido o faltante' })

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })

    const perfil = user.perfil || {}
    if (!perfil.objetivo || !(perfil.diasDispo?.length || perfil.diasDisponibles?.length)) {
      return res.status(400).json({ error: 'Falta el perfil del usuario' })
    }

    const perfilCompleto = {
      ...perfil,
      diasDispo: perfil.diasDispo || perfil.diasDisponibles || [],
      tipoDieta: perfil.tipoDieta || 'normal',
      limitaciones: perfil.limitaciones || [],
      minutosPorSesion: perfil.minutosPorSesion || 45,
      presupuesto: perfil.presupuesto || 15000,
      nivel: perfil.nivel || 'principiante'
    }

    const contenido = armarPlanMock(perfilCompleto)

    await Plan.updateOne(
      { userId, estado: 'activo' },
      { estado: 'archivado' }
    )

    const ultimoPlan = await Plan.findOne(
      { userId },
      {},
      { sort: { createdAt: -1 } }
    )
    const version = ultimoPlan ? ultimoPlan.version + 1 : 1

    const nuevoPlan = new Plan({
      userId,
      version,
      estado: 'activo',
      meta: contenido.meta,
      rutina: contenido.rutina,
      dieta: contenido.dieta
    })
    await nuevoPlan.save()

    return res.json({
      ok: true,
      planId: nuevoPlan._id,
      version,
      plan: contenido
    })
  }
  catch (error) {
    console.error('Error al generar el plan:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

exports.getPlanActual = async (req, res) => {
  try {
    const { userId } = req.params
    const plan = await Plan.findOne({
      userId,
      estado: 'activo'
    })
    if (!plan) return res.status(404).json({ error: 'Sin plan activo' })
    res.json(plan)
  }
  catch (error) {
    console.error('Error al obtener el plan actual:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}