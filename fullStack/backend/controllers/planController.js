const { dispararPlan } = require('../services/webhookService')
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
      return res.status(400).json({ error: 'Falta el perfil del usuario' })
    }

    const perfilCompleto = {
      ...perfil,
      diasDispo:        perfil.diasDispo || [],
      tipoDieta:        perfil.tipoDieta || 'normal',
      limitaciones:     perfil.limitaciones || [],
      minutosPorSesion: perfil.minutosPorSesion || 45,
      presupuesto:      perfil.presupuesto || 15000,
      nivel:            perfil.nivel || 'principiante'
    }

    let respuestaN8N
    try {
      respuestaN8N = await dispararPlan(userId.toString(), perfilCompleto)
      if (!respuestaN8N?.plan) throw new Error('N8N no devolvió un plan')
    } catch (n8nError) {
      console.error('N8N no disponible:', n8nError.message)
      return res.status(503).json({ error: 'El servicio de generación no está disponible. Intentá de nuevo.' })
    }

    return res.json({
      ok:   true,
      plan: respuestaN8N.plan
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