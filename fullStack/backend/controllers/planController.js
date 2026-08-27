const { generarPlan } = require('../services/iaService')
const User = require('../models/User')
const Plan = require('../models/Plan')

exports.generarPlan = async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) return res.status(401).json({ error: 'Token inválido o faltante' })

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })

    const perfil = user.perfil || {}
    if (!perfil.objetivo || !(perfil.diasDispo?.length)) {
      return res.status(400).json({ error: 'Falta completar el perfil antes de generar un plan' })
    }

    const perfilCompleto = {
      ...perfil,
      diasDispo: perfil.diasDispo        || [],
      tipoDieta: perfil.tipoDieta        || 'normal',
      limitaciones: perfil.limitaciones     || [],
      minutosPorSesion: perfil.minutosPorSesion || 45,
      presupuesto: perfil.presupuesto || 15000,
      nivel: perfil.nivel || 'principiante'
    }

    const planGenerado = await generarPlan(perfilCompleto)

    await Plan.updateMany({ userId, estado: 'activo' }, { $set: { estado: 'archivado' } })

    const savedPlan = await Plan.create({
    // Llamar a Groq directamente a través de iaService

    try {
      planData = await generarPlan(perfilCompleto)
      
      if (!planData) throw new Error('iaService no devolvió un plan')
    } catch (iaError) {
      console.error('Error al generar plan con Groq:', iaError.message)
      return res.status(503).json({ error: 'El servicio de IA no está disponible. Intentá de nuevo.' })
    }

    await Plan.updateMany({ userId, estado: 'activo' }, { estado: 'archivado' })

    // Guardar plan nuevo en MongoDB

    const savedPlan = await Plan.create({
      userId,
      estado: 'activo',
      meta: {
        objetivo: perfilCompleto.objetivo,
        nivel: perfilCompleto.nivel,
        tipoDieta: perfilCompleto.tipoDieta,
        diasDisponibles: perfilCompleto.diasDispo || [],
        minutosPorSesion: perfilCompleto.minutosPorSesion,
        presupuesto: perfilCompleto.presupuesto
      },
      rutina: Array.isArray(planData.rutina) ? planData.rutina : [],
      dieta: Array.isArray(planData.dieta) ? planData.dieta : []
    })

    return res.json({
      ok: true,
      plan: savedPlan
    })

  } catch (error) {
    console.error('Error al generar el plan:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

exports.getPlanActual = async (req, res) => {
  try {
    const userId = req.user.userId
    const plan = await Plan.findOne({ userId, estado: 'activo' })
    if (!plan) return res.status(404).json({ error: 'Sin plan activo' })
    res.json(plan)
  } catch (error) {
    console.error('Error al obtener el plan actual:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}