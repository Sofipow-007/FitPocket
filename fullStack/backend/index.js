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

// En Express 5 el error de listen (por ejemplo, puerto ocupado) llega a este callback:
// sin chequearlo, el proceso quedaba vivo diciendo "corriendo" sin escuchar nada.
server.listen(PORT, (error) => {
    if (error) {
        console.error(`No se pudo iniciar el servidor en el puerto ${PORT}: ${error.message}`);
        process.exit(1);
    }
    console.log(`Servidor de FitPocket corriendo en puerto ${PORT}`);
});