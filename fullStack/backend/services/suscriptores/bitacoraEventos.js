const Bitacora = require('../../models/Bitacora')
const { eventos, EVENTOS } = require('../eventos')

// Observer: registra en la bitácora los eventos de negocio. El middleware de
// bitácora ya guarda cada request; esto suma qué significó (ej. "plan generado").
// No se guardan emails ni datos personales: solo ids y números.

const ACCIONES = {
  [EVENTOS.CHECKIN_REGISTRADO]: 'Evento: checkin registrado',
  [EVENTOS.PLAN_GENERADO]: 'Evento: plan generado',
  [EVENTOS.USUARIO_BORRADO]: 'Evento: usuario borrado',
  [EVENTOS.INTEGRIDAD_ALTERADA]: 'Evento: integridad alterada',
}

const DETALLES = {
  [EVENTOS.CHECKIN_REGISTRADO]: (d) => `fecha ${d.fecha}, puntaje ${d.puntajeTotal}`,
  [EVENTOS.PLAN_GENERADO]: (d) => `plan ${d.planId}`,
  [EVENTOS.USUARIO_BORRADO]: (d) => `usuario ${d.userIdBorrado}${d.porAdmin ? ' (por un admin)' : ' (baja propia)'}`,
  [EVENTOS.INTEGRIDAD_ALTERADA]: (d) => `${d.registrosAlterados} registro(s) alterado(s) en ${d.colecciones.join(', ')}`,
}

function registrar() {
  for (const evento of Object.keys(ACCIONES)) {
    eventos.suscribir(evento, (datos) => Bitacora.create({
      userId: datos.userId || null,
      accion: ACCIONES[evento],
      metodo: 'EVENTO',
      ruta: evento,
      detalles: DETALLES[evento](datos),
    }))
  }
}

module.exports = { registrar }
