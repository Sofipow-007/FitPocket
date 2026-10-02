// Fecha calendario (YYYY-MM-DD) en horario de Argentina, sin importar
// en qué timezone corra el servidor. Evita que un checkin hecho después
// de las 21:00 (UTC-3) se guarde con la fecha del día siguiente por usar
// toISOString() (UTC).
const formateador = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Argentina/Buenos_Aires'
})

function fechaLocal(fecha = new Date()) {
  return formateador.format(fecha)
}

function normalize(s = '') {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

module.exports = { fechaLocal, normalize }
