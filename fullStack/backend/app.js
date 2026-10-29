const express = require('express')
const cors = require('cors')
const compression = require('compression')
const { registrarSuscriptores } = require('./services/suscriptores')

// La app se arma acá sin conectar a la base ni escuchar el puerto,
// así los tests la pueden importar con Supertest.
const app = express()

// Observer: bitácora de eventos de negocio y alertas de adherencia
registrarSuscriptores()

app.use(cors())
// gzip de las respuestas: el plan completo pasa de 7,7 KB a 2,3 KB
app.use(compression())
app.use(express.json())
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
