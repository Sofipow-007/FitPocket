const express = require('express')
const cors = require('cors')

// La app se arma acá sin conectar a la base ni escuchar el puerto,
// así los tests la pueden importar con Supertest.
const app = express()

app.use(cors())
app.use(express.json())
app.use(require('./middleware/bitacora'))

app.use('/auth',    require('./routes/authRoutes'))
app.use('/users',   require('./routes/userRoutes'))
app.use('/plan',    require('./routes/planRoutes'))
app.use('/checkins', require('./routes/checkinRoutes'))

// Body con JSON mal formado: sin esto Express devuelve HTML con el stack trace
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido' })
  }
  next(err)
})

module.exports = app
