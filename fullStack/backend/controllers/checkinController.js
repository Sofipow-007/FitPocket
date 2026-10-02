const Checkin = require('../models/Checkin')
const Plan    = require('../models/Plan')
const { fechaLocal, normalize } = require('../utils/fecha')

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

exports.getAdherenciaSemana = async (req, res) => {
  try {
    const userId = req.user.userId

    // últimos 7 días (fecha calendario en horario de Argentina)
    const dias = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      dias.push(fechaLocal(d))
    }

    const plan = await Plan.findOne({ userId, estado: 'activo' })
    const diasEntreno = new Set(
      (plan?.rutina || [])
        .filter(r => Array.isArray(r.ejercicios) && r.ejercicios.length > 0)
        .map(r => normalize(r.dia))
    )
    const diasDeEntreno = diasEntreno.size

    const checkins = await Checkin.find({ userId, fecha: { $in: dias } })

    const porFecha = {}
    checkins.forEach(c => { porFecha[c.fecha] = c })

    const semana = dias.map(fecha => ({
      fecha,
      checkin: porFecha[fecha] ?? null
    }))

    // la rutina solo cuenta en los días que el plan activo tiene ejercicios;
    // la dieta cuenta los 7 días. Así alguien que descansa cuando el plan
    // indica descanso no pierde puntos por eso.
    let puntos = 0
    let diasConCheckin = 0
    dias.forEach(fecha => {
      const c = porFecha[fecha]
      if (!c) return
      diasConCheckin++
      puntos += c.dieta?.puntaje ?? 0
      const diaSemana = new Date(`${fecha}T00:00:00`).toLocaleDateString('es-AR', { weekday: 'long' })
      if (diasEntreno.has(normalize(diaSemana))) {
        puntos += c.rutina?.puntaje ?? 0
      }
    })

    const maximo = diasDeEntreno + 7
    const porcentaje = Math.round((puntos / maximo) * 100)

    // racha: días consecutivos hacia atrás (desde hoy) con puntajeTotal > 0
    let racha = 0
    for (let i = dias.length - 1; i >= 0; i--) {
      const c = porFecha[dias[i]]
      if (!c || c.puntajeTotal <= 0) break
      racha++
    }

    res.json({ semana, porcentaje, diasConCheckin, diasDeEntreno, racha })
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}
