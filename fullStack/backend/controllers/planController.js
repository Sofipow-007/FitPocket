const Plan = require('../models/Plan')
const User = require('../models/User')
const { generarPlan } = require('../services/iaService')
// const { dispararPlan } = require('../services/webhookService')

// función interna que arma el plan según el perfil
// cuando tengan la API key, esto se reemplaza por generarPlan(perfil) de iaService.js
const armarPlanMock = (perfil) => {

  const diasEntrenamiento = perfil.diasDispo || []
  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

  // ejercicios según objetivo
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

  // filtrar ejercicios según limitaciones
  const limitaciones = perfil.limitaciones || []
  let ejercicios = ejerciciosPorObjetivo[perfil.objetivo] || ejerciciosPorObjetivo['salud general']
  if (limitaciones.includes('espalda baja')) {
    ejercicios = ejercicios.filter(e => !['Remo con barra', 'Sentadilla con peso'].includes(e.nombre))
  }
  if (limitaciones.includes('rodilla')) {
    ejercicios = ejercicios.filter(e => !['Sentadilla', 'Burpees', 'Saltos de soga'].includes(e.nombre))
  }

  // armar rutina para los 7 días
  const rutina = diasSemana.map(dia => {
    const diaMinuscula = dia.toLowerCase()
      .replace('é', 'e').replace('á', 'a')
    const entrena = diasEntrenamiento.some(d =>
      d.toLowerCase().replace('é', 'e').replace('á', 'a') === diaMinuscula
    )
    return {
      dia,
      tipo: entrena ? `Entrenamiento — ${perfil.objetivo}` : 'Descanso',
      duracionMinutos: entrena ? (perfil.minutosPorSesion || 45) : 0,
      ejercicios: entrena ? ejercicios : []
    }
  })

  // dieta base según tipo
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
    }
  }

  const comidas = comidasPorDieta[perfil.tipoDieta] || comidasPorDieta['normal']
  const caloriasTotal = Object.values(comidas).reduce((acc, c) => acc + c.calorias, 0)
  const costoDia = Math.round((perfil.presupuesto || 15000) / 30)

  const dieta = diasSemana.map(dia => ({
    dia,
    ...comidas,
    costoEstimadoDia: costoDia
  }))

  return {
    meta: {
      objetivo: perfil.objetivo,
      duracionSemanas: 4,
      caloriasObjetivoDia: caloriasTotal,
      nivelDificultad: perfil.nivel || 'principiante',
      justificacion: `Plan de ${perfil.objetivo} para nivel ${perfil.nivel || 'principiante'}, ${diasEntrenamiento.length} días por semana de ${perfil.minutosPorSesion || 45} minutos. Dieta ${perfil.tipoDieta || 'normal'}.`
    },
    rutina,
    dieta
  }
}

exports.generarPlanDemo = async (req, res) => {
    try {
        const userId = req.user?.userId
        if (!userId) return res.status(401).json({ error: 'Token inválido o faltante' })

        const user = await User.findById(userId)
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })

        const perfil = user.perfil
        if (!perfil || !perfil.objetivo || !perfil.diasDispo) return res.status(400).json({ error: 'Falta el perfil del usuario' })
        
        // Armar plan con el perfil del usuario
        const contenido = await armarPlanMock(perfil)

        // archivar el plan activo anterior si existe
        await Plan.updateOne(
            { userId, estado: 'activo' },
            { estado: 'archivado' }
        )

        // calcular la versión nueva
        const ultimoPlan = await Plan.findOne(
            { userId },
            {},
            { sort: { createdAt: -1 } }
        )
        const version = ultimoPlan ? ultimoPlan.version + 1 : 1

        // guardar el plan nuevo
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
    try{
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