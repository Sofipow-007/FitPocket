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

// Red de seguridad sobre lo que devuelve la IA: términos que no pueden aparecer
// en el nombre de un ejercicio según la limitación del usuario.
const PROHIBIDOS = {
  lumbar:       /salt|jump|burpee|peso muerto(?! rumano)|deadlift|buenos d[ií]as|good morning/i,
  rodilla:      /salt|jump|burpee|sentadilla profunda|deep squat|pistol|zancada con salto|sprint|carrera|running/i,
  hombro:       /tras nuca|behind the neck|fondos en paralelas|dips/i,
  hipertension: /hiit|burpee|sprint|tabata|al fallo|m[aá]xim/i
}

// Reemplaza un ejercicio contraindicado por su primera alternativa permitida; si no tiene, lo quita.
const filtrarContraindicados = (rutina, limitaciones) => {
  const reglas = limitaciones.map(l => PROHIBIDOS[l]).filter(Boolean)
  if (reglas.length === 0) return rutina
  const prohibido = (nombre) => reglas.some(re => re.test(String(nombre || '')))
  return rutina.map(dia => ({
    ...dia,
    ejercicios: (dia.ejercicios || []).flatMap(ej => {
      const alternativas = (ej.alternativas || []).filter(alt => !prohibido(alt.nombre))
      if (!prohibido(ej.nombre)) return [{ ...ej, alternativas }]
      if (alternativas.length === 0) return []
      const [reemplazo, ...resto] = alternativas
      return [{ ...reemplazo, alternativas: resto }]
    })
  }))
}

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
      nivel:            perfil.nivel            || 'principiante',
      idioma:           req.body?.idioma === 'en' ? 'en' : 'es'
    }

    const diasElegidos = new Set(perfilCompleto.diasDispo.map(normalizarDia))
    const diasCubiertos = (plan) => new Set((plan?.rutina || []).map(r => normalizarDia(r.dia)).filter(d => diasElegidos.has(d))).size

    let planGenerado
    try {
      planGenerado = await generarPlan(perfilCompleto)
      if (!planGenerado) throw new Error('iaService no devolvió un plan')
      // si la IA se salteó algún día elegido, se le pide el plan una vez más
      if (diasCubiertos(planGenerado) < diasElegidos.size) {
        console.log('La rutina no cubre todos los días elegidos, reintentando...')
        const segundo = await generarPlan(perfilCompleto)
        if (diasCubiertos(segundo) > diasCubiertos(planGenerado)) planGenerado = segundo
      }
    } catch (iaError) {
      console.error('Error al generar plan con Groq:', iaError.message)
      return res.status(503).json({ error: 'El servicio de IA no está disponible. Intentá de nuevo.' })
    }

    await Plan.updateMany({ userId, estado: 'activo' }, { $set: { estado: 'archivado' } })

    // nivelDificultad tiene enum en el modelo: si la IA devolvía otra cosa ("Intermediate",
    // "intermedio-avanzado") el guardado fallaba con 500. Se usa el nivel del propio usuario.
    if (planGenerado.meta) planGenerado.meta.nivelDificultad = perfilCompleto.nivel
    // el prompt pide entrenar solo los días disponibles, pero eso lo decide el modelo:
    // acá se garantiza descartando cualquier día que el usuario no eligió
    planGenerado.rutina = filtrarContraindicados(
      (planGenerado.rutina || []).filter(r => diasElegidos.has(normalizarDia(r.dia))),
      perfilCompleto.limitaciones
    ).filter(r => r.ejercicios.length > 0)
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