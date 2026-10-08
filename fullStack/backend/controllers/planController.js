const { generarPlan } = require('../services/iaService')
const User = require('../models/User')
const Plan = require('../models/Plan')
const { decrypt } = require('../utils/crypto')

// Desencripta un campo sin tirar la request abajo si CRYPTO_KEY cambió
// o el valor no estaba encriptado (datos viejos).
const decryptSeguro = (texto) => {
  try {
    return decrypt(texto)
  } catch {
    return texto
  }
}

// 'Miércoles' y 'miercoles' son el mismo día
const normalizarDia = (dia) => String(dia || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()

exports.generarPlan = async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) return res.status(401).json({ error: 'Token inválido o faltante' })

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })

    const perfil = user.perfil ? user.perfil.toObject() : {}
    if (!perfil.objetivo || !(perfil.diasDispo?.length)) {
      return res.status(400).json({ error: 'Falta completar el perfil antes de generar un plan' })
    }

    const perfilCompleto = {
      ...perfil,
      diasDispo:        perfil.diasDispo        || [],
      tipoDieta:        perfil.tipoDieta        || 'normal',
      // limitaciones y aclaración se guardan encriptadas (son datos de salud);
      // acá se desencriptan para que la IA reciba texto plano.
      limitaciones:     (perfil.limitaciones || []).map(decryptSeguro),
      aclaracion:       perfil.aclaracion ? decryptSeguro(perfil.aclaracion) : '',
      minutosPorSesion: perfil.minutosPorSesion || 45,
      presupuesto:      perfil.presupuesto      || 15000,
      nivel:            perfil.nivel            || 'principiante'
    }

    let planGenerado
    try {
      planGenerado = await generarPlan(perfilCompleto)
      if (!planGenerado) throw new Error('iaService no devolvió un plan')
    } catch (iaError) {
      console.error('Error al generar plan con Groq:', iaError.message)
      return res.status(503).json({ error: 'El servicio de IA no está disponible. Intentá de nuevo.' })
    }

    await Plan.updateMany({ userId, estado: 'activo' }, { $set: { estado: 'archivado' } })

    if (planGenerado.meta?.nivelDificultad) {
      planGenerado.meta.nivelDificultad = planGenerado.meta.nivelDificultad.toLowerCase()
    }
    // el prompt pide entrenar solo los días disponibles, pero eso lo decide el modelo:
    // acá se garantiza descartando cualquier día que el usuario no eligió
    const diasElegidos = new Set(perfilCompleto.diasDispo.map(normalizarDia))
    planGenerado.rutina = (planGenerado.rutina || []).filter(r => diasElegidos.has(normalizarDia(r.dia)))
    if (planGenerado.rutina.length === 0) {
      console.error('Error al generar plan con Groq: la rutina no trae ningún día disponible')
      return res.status(503).json({ error: 'El servicio de IA no está disponible. Intentá de nuevo.' })
    }

    // el prompt de rutina no recibe el presupuesto, así que la IA lo inventaba
    if (planGenerado.meta) planGenerado.meta.presupuestoMensual = perfilCompleto.presupuesto

    const savedPlan = await Plan.create({
      userId,
      estado: 'activo',
      meta:   planGenerado.meta,
      rutina: planGenerado.rutina,
      dieta:  planGenerado.dieta
    })

    console.log('Plan generado y guardado exitosamente para el usuario. ', savedPlan)

    return res.json({ ok: true, plan: savedPlan })

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