require('dotenv').config();

const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db')

const server = express()

connectDB()

server.use(cors())
server.use(express.json())
server.use(require('./middleware/bitacora'))

server.use('/auth',    require('./routes/authRoutes'))
server.use('/users',   require('./routes/userRoutes'))
server.use('/plan',    require('./routes/planRoutes'))
server.use('/checkins', require('./routes/checkinRoutes'))

// Body con JSON mal formado: sin esto Express devuelve HTML con el stack trace
server.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido' })
  }
  next(err)
})

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Servidor de FitPocket corriendo en puerto ${PORT}`);
});