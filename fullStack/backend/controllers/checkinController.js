const Checkin = require('../models/Checkin')
const Plan    = require('../models/Plan')
const { fechaLocal } = require('../utils/fecha')
const { adherenciaDeUsuario, estrategiaAdherencia } = require('../services/adherenciaService')
const { eventos, EVENTOS } = require('../services/eventos')

const PUNTAJE = { completado: 1, parcial: 0.5, no_hice: 0 }

exports.registrarCheckin = async (req, res) => {
  try {
    const userId = req.user.userId
    const { rutina, dieta } = req.body

    if (!(rutina in PUNTAJE) || !(dieta in PUNTAJE)) {
      return res.status(400).json({ error: 'Estado inválido' })
    }

    const fecha = fechaLocal()

    const puntajeRutina = PUNTAJE[rutina]
    const puntajeDieta  = PUNTAJE[dieta]

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
      { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true }
    )

    eventos.emitir(EVENTOS.CHECKIN_REGISTRADO, { userId, checkinId: checkin._id, fecha, puntajeTotal: checkin.puntajeTotal })

    res.json({ ok: true, checkin })
  } catch (error) {
    console.error('Error al registrar checkin:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

exports.getCheckinHoy = async (req, res) => {
  try {
    const userId = req.user.userId
    const fecha  = fechaLocal()
    const checkin = await Checkin.findOne({ userId, fecha })
    res.json({ checkin: checkin ?? null })
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// GET /checkins/semana — adherencia de los últimos 7 días (estrategia semanal)
exports.getAdherenciaSemana = async (req, res) => {
  try {
    const { dias, ...resultado } = await adherenciaDeUsuario(req.user.userId, estrategiaAdherencia('semanal'))
    res.json({ semana: dias, ...resultado })
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// GET /checkins/mes — últimos 30 días (estrategia mensual, base para RF08)
exports.getAdherenciaMes = async (req, res) => {
  try {
    res.json(await adherenciaDeUsuario(req.user.userId, estrategiaAdherencia('mensual')))
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}
