const express = require('express')
const cors = require('cors')
const compression = require('compression')
const { registrarSuscriptores } = require('./services/suscriptores')
const { origenesPermitidos, esProduccion } = require('./config/entorno')

// La app se arma acá sin conectar a la base ni escuchar el puerto,
// así los tests la pueden importar con Supertest.
const app = express()

// Observer: bitácora de eventos de negocio y alertas de adherencia
registrarSuscriptores()

// En Render/Railway la app corre detrás de un proxy: sin esto req.ip (que guarda
// la bitácora) sería la IP del proxy y no la del usuario
if (esProduccion()) app.set('trust proxy', 1)

// CORS: solo el front configurado en FRONTEND_URL (en desarrollo, también localhost:5173).
// Los pedidos sin Origin (curl, el chequeo de salud de la plataforma) no pasan por CORS.
const permitidos = origenesPermitidos()
app.use(cors({
  origin: (origen, listo) => listo(null, !origen || permitidos.includes(origen)),
}))
// gzip de las respuestas: el plan completo pasa de 7,7 KB a 2,3 KB
app.use(compression())
app.use(express.json())
// En Express 5 un pedido sin cuerpo JSON deja req.body en undefined: los controllers
// que leen req.body.email tiraban un TypeError (500) en vez de responder 400
app.use((req, res, next) => {
  if (req.body === undefined) req.body = {}
  next()
})
// Chequeo de salud para la plataforma de hosting: no toca la base ni pasa por la bitácora
app.get('/salud', (req, res) => res.json({ ok: true }))

app.use(require('./middleware/bitacora'))

app.use('/auth',    require('./routes/authRoutes'))
app.use('/users',   require('./routes/userRoutes'))
app.use('/plan',    require('./routes/planRoutes'))
app.use('/checkins', require('./routes/checkinRoutes'))
app.use('/permisos', require('./routes/permisosRoutes'))
app.use('/integridad', require('./routes/integridadRoutes'))
app.use('/bitacora', require('./routes/bitacoraRoutes'))
app.use('/backup', require('./routes/backupRoutes'))

// Body con JSON mal formado: sin esto Express devuelve HTML con el stack trace
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido' })
  }
  next(err)
})

module.exports = app
