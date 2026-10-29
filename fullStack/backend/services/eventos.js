const { EventEmitter } = require('events')

// Patrón Observer: los controllers avisan "pasó X" y no saben quién escucha.
// Los suscriptores (bitácora, alertas de adherencia, ...) se registran en services/suscriptores.

const EVENTOS = {
  CHECKIN_REGISTRADO: 'checkin.registrado',
  PLAN_GENERADO: 'plan.generado',
  USUARIO_BORRADO: 'usuario.borrado',
  INTEGRIDAD_ALTERADA: 'integridad.alterada',
}

class BusDeEventos extends EventEmitter {
  // Los suscriptores son async: si uno falla se registra el error, pero no tira
  // abajo la request que emitió el evento ni impide que corran los demás.
  suscribir(evento, manejador) {
    this.on(evento, (datos) => {
      Promise.resolve()
        .then(() => manejador(datos))
        .catch(error => console.error(`Error en un suscriptor de ${evento}:`, error.message))
    })
  }

  emitir(evento, datos = {}) {
    this.emit(evento, { ...datos, ocurrioEn: new Date() })
  }
}

// Una sola instancia para toda la app
const eventos = new BusDeEventos()

module.exports = { eventos, EVENTOS, BusDeEventos }
