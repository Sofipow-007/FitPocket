const Checkin = require('../models/Checkin')
const Plan    = require('../models/Plan')
const { fechaLocal, normalize } = require('../utils/fecha')

// Patrón Strategy: el período sobre el que se mide la adherencia es intercambiable.
// La semanal es la que muestra el dashboard; la mensual queda lista para RF08.
class EstrategiaAdherencia {
  constructor(cantidadDias) {
    this.cantidadDias = cantidadDias
  }

  get nombre() {
    throw new Error('Cada estrategia tiene que definir su nombre')
  }

  // Fechas del período, de la más vieja a hoy (calendario de Argentina)
  fechas(hoy = new Date()) {
    const dias = []
    for (let i = this.cantidadDias - 1; i >= 0; i--) {
      const d = new Date(hoy)
      d.setDate(d.getDate() - i)
      dias.push(fechaLocal(d))
    }
    return dias
  }
}

class AdherenciaSemanal extends EstrategiaAdherencia {
  constructor() { super(7) }
  get nombre() { return 'semanal' }
}

class AdherenciaMensual extends EstrategiaAdherencia {
  constructor() { super(30) }
  get nombre() { return 'mensual' }
}

const ESTRATEGIAS = { semanal: AdherenciaSemanal, mensual: AdherenciaMensual }

function estrategiaAdherencia(nombre = 'semanal') {
  const Clase = ESTRATEGIAS[nombre]
  if (!Clase) throw new Error(`Período de adherencia inválido: ${nombre}`)
  return new Clase()
}

const diaDeLaSemana = (fecha) => normalize(
  new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long' })
)

// Cálculo puro (sin base de datos), así se puede probar con datos armados a mano.
// - la rutina solo cuenta en los días que el plan tiene ejercicios; la dieta cuenta todos los días.
//   Así alguien que descansa cuando el plan indica descanso no pierde puntos por eso.
// - los días anteriores al primer plan no cuentan: sin esto alguien que arrancó hoy
//   y cumplió todo veía 20% y "adherencia baja".
// - racha: días consecutivos hacia atrás (desde hoy) con puntajeTotal > 0
function calcularAdherencia({ fechas, diasEntreno, desde, porFecha }) {
  const esDiaDeEntreno = (fecha) => diasEntreno.has(diaDeLaSemana(fecha))
  const vigentes = fechas.filter(fecha => !desde || fecha >= desde)

  let puntos = 0
  let diasConCheckin = 0
  vigentes.forEach(fecha => {
    const c = porFecha[fecha]
    if (!c) return
    diasConCheckin++
    puntos += c.dieta?.puntaje ?? 0
    if (esDiaDeEntreno(fecha)) puntos += c.rutina?.puntaje ?? 0
  })

  const maximo = vigentes.filter(esDiaDeEntreno).length + vigentes.length
  const porcentaje = maximo > 0 ? Math.round((puntos / maximo) * 100) : 0

  let racha = 0
  for (let i = fechas.length - 1; i >= 0; i--) {
    const c = porFecha[fechas[i]]
    if (!c || c.puntajeTotal <= 0) break
    racha++
  }

  return { porcentaje, diasConCheckin, diasDeEntreno: diasEntreno.size, diasContados: vigentes.length, racha }
}

// Junta de la base lo que necesita el cálculo y devuelve el resultado del período
async function adherenciaDeUsuario(userId, estrategia = new AdherenciaSemanal(), hoy = new Date()) {
  const fechas = estrategia.fechas(hoy)

  const plan = await Plan.findOne({ userId, estado: 'activo' }).select('rutina.dia rutina.ejercicios').lean()
  const diasEntreno = new Set(
    (plan?.rutina || [])
      .filter(r => Array.isArray(r.ejercicios) && r.ejercicios.length > 0)
      .map(r => normalize(r.dia))
  )

  const primerPlan = plan && await Plan.findOne({ userId }).sort({ createdAt: 1 }).select('createdAt').lean()
  const desde = primerPlan ? fechaLocal(primerPlan.createdAt) : null

  const checkins = await Checkin.find({ userId, fecha: { $in: fechas } }).lean()
  const porFecha = Object.fromEntries(checkins.map(c => [c.fecha, c]))

  return {
    periodo: estrategia.nombre,
    dias: fechas.map(fecha => ({ fecha, checkin: porFecha[fecha] ?? null })),
    ...calcularAdherencia({ fechas, diasEntreno, desde, porFecha }),
  }
}

module.exports = {
  EstrategiaAdherencia,
  AdherenciaSemanal,
  AdherenciaMensual,
  estrategiaAdherencia,
  calcularAdherencia,
  adherenciaDeUsuario,
}
