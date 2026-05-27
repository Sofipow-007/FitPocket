const Plan = require('../models/Plan')

const guardarPlan = async (req, res) => {
    const { userId, meta , rutina, dieta, version } = req.body



    await Plan.updateOne(
        { userId, estado : 'activo'},
        { estado: 'archivado'}
    )

    const nuevoPlan = new Plan ({
        userId,
        version : version || 1,
        estado : 'activo',
        meta, rutina, dieta
    })

    await nuevoPlan.save()
    res.json({ok: true, planId: nuevoPlan._id })
}

const getPlanActual = async (req, res) => {
    const plan = await Plan.findOne({
        userId: req.userId,
        estado: 'activo'
    })
    if (!plan) return res.status(404).json({ error: 'Sin plan activo'})
    res.json(plan)
}
module.exports = { guardarPlan, getPlanActual }