const Plan = require('../models/Plan')
const User = require('../models/User')
const { generarPlan } = require('../services/iaService')
// const { dispararPlan } = require('../services/webhookService')

const generarPlanDemo = async (req, res) => {
    try {
        const { perfil } = req.body

        if (!perfil || !perfil.objetivo || !perfil.diasDispo) return res.status(400).json({ error: 'Falta el perfil del usuario' })

        const plan = await generarPlan(perfil)
        if (req.body.userId) {

            // archivar el plan activo anterior si existe
            await Plan.updateOne(
                { userId: req.body.userId, estado: 'activo' },
                { estado: 'archivado' }
            )

            // calcular la versión nueva
            const ultimoPlan = await Plan.findOne(
                { userId: req.body.userId },
                {},
                { sort: { createdAt: -1 } }
            )
            const version = ultimoPlan ? ultimoPlan.version + 1 : 1

            // guardar el plan nuevo
            const nuevoPlan = new Plan({
                userId: req.body.userId,
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

        // sin userId: devuelve el plan sin guardar
        res.json({ ok: true, plan: contenido })
    }
    catch (error) {
        console.error('Error al generar el plan:', error)
        return res.status(500).json({ error: 'Error interno del servidor' })
    }
}

const guardarPlan = async (req, res) => {
    const { userId, meta, rutina, dieta, version } = req.body

    await Plan.updateOne(
        { userId, estado: 'activo' },
        { estado: 'archivado' }
    )

    const nuevoPlan = new Plan({
        userId,
        version: version || 1,
        estado: 'activo',
        meta, rutina, dieta
    })

    await nuevoPlan.save()
    res.json({ ok: true, planId: nuevoPlan._id })
}

const getPlanActual = async (req, res) => {
    const plan = await Plan.findOne({
        userId: req.userId,
        estado: 'activo'
    })
    if (!plan) return res.status(404).json({ error: 'Sin plan activo' })
    res.json(plan)
}
module.exports = { guardarPlan, getPlanActual }