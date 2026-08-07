const Checkin = require('../models/Checkin')
const Plan    = require('../models/Plan')

const PUNTAJE = { completado: 1, parcial: 0.5, no_hice: 0 }

exports.registrarCheckin = async (req, res) => {
  try {
    const userId = req.user.userId
    const { rutina, dieta } = req.body

    if (!rutina || !dieta) {
      return res.status(400).json({ error: 'Falta rutina o dieta' })
    }

    const fecha = new Date().toISOString().split('T')[0]

    const puntajeRutina = PUNTAJE[rutina] ?? 0
    const puntajeDieta  = PUNTAJE[dieta]  ?? 0

    const plan = await Plan.findOne({ userId, estado: 'activo' })

    const checkin = await Checkin.findOneAndUpdate(
      { userId, fecha },
      {
        userId,
        planId: plan?._id ?? null,
        fecha,
        rutina:  { estado: rutina, puntaje: puntajeRutina },
        dieta:   { estado: dieta,  puntaje: puntajeDieta  },
        puntajeTotal: puntajeRutina + puntajeDieta
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    res.json({ ok: true, checkin })
  } catch (error) {
    console.error('Error al registrar checkin:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

exports.getCheckinHoy = async (req, res) => {
  try {
    const userId = req.user.userId
    const fecha  = new Date().toISOString().split('T')[0]
    const checkin = await Checkin.findOne({ userId, fecha })
    res.json({ checkin: checkin ?? null })
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

exports.getAdherenciaSemana = async (req, res) => {
  try {
    const userId = req.user.userId

    // últimos 7 días
    const dias = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      dias.push(d.toISOString().split('T')[0])
    }

    const checkins = await Checkin.find({ userId, fecha: { $in: dias } })

    const porFecha = {}
    checkins.forEach(c => { porFecha[c.fecha] = c })

    const semana = dias.map(fecha => ({
      fecha,
      checkin: porFecha[fecha] ?? null
    }))

    const totalPuntos = checkins.reduce((sum, c) => sum + c.puntajeTotal, 0)
    const porcentaje  = Math.round((totalPuntos / 14) * 100)

    res.json({ semana, porcentaje })
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}