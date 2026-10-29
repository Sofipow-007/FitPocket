// Registra una sola vez todos los suscriptores del bus de eventos (Observer)
let registrados = false

function registrarSuscriptores() {
  if (registrados) return
  registrados = true
  require('./bitacoraEventos').registrar()
  require('./alertasAdherencia').registrar()
}

module.exports = { registrarSuscriptores }
