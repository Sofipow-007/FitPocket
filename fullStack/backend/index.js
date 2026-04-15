require('dotenv').config();
const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db')

const server = express()

connectDB()

server.use(cors())
server.use(express.json())

server.use('/auth', require('./routes/authRoutes'))

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Servidor de FitPlan AI corriendo en puerto ${PORT}`);
});