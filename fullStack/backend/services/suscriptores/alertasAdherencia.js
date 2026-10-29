const Bitacora = require('../../models/Bitacora')
const User = require('../../models/User')
const { eventos, EVENTOS } = require('../eventos')
const { adherenciaDeUsuario, AdherenciaSemanal } = require('../adherenciaService')
const { enviarAlertaAdherencia, smtpConfigurado } = require('../mailService')

// Observer: después de cada checkin revisa la adherencia de la semana.
// Si baja del 50% con al menos 3 días contados, registra una alerta (RF10 parcial)
// y, si hay SMTP, le manda un mail al usuario. Como mucho una alerta por día.

const UMBRAL_PORCENTAJE = 50
const DIAS_MINIMOS = 3
const ACCION_ALERTA = 'Alerta de adherencia baja'

function debeAlertar({ porcentaje, diasContados }) {
  return diasContados >= DIAS_MINIMOS && porcentaje < UMBRAL_PORCENTAJE
}

async function revisarAdherencia({ userId }) {
  const adherencia = await adherenciaDeUsuario(userId, new AdherenciaSemanal())
  if (!debeAlertar(adherencia)) return null

  const inicioDelDia = new Date()
  inicioDelDia.setHours(0, 0, 0, 0)
  const yaAlertado = await Bitacora.exists({ userId, accion: ACCION_ALERTA, createdAt: { $gte: inicioDelDia } })
  if (yaAlertado) return null

  await Bitacora.create({
    userId,
    accion: ACCION_ALERTA,
    metodo: 'EVENTO',
    ruta: EVENTOS.CHECKIN_REGISTRADO,
    detalles: `adherencia semanal ${adherencia.porcentaje}% con ${adherencia.diasContados} día(s) contados`,
  })

  if (smtpConfigurado()) {
    const user = await User.findById(userId).select('email').lean()
    if (user) await enviarAlertaAdherencia({ email: user.email, idioma: 'es', porcentaje: adherencia.porcentaje })
  }
  return adherencia
}

function registrar() {
  eventos.suscribir(EVENTOS.CHECKIN_REGISTRADO, revisarAdherencia)
}

module.exports = { registrar, revisarAdherencia, debeAlertar, UMBRAL_PORCENTAJE, DIAS_MINIMOS, ACCION_ALERTA }
