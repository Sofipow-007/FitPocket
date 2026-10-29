require('dotenv').config();

const connectDB = require('./config/db')
const app = require('./app')

connectDB()

const PORT = process.env.PORT || 3000;

// En Express 5 el error de listen (por ejemplo, puerto ocupado) llega a este callback:
// sin chequearlo, el proceso quedaba vivo diciendo "corriendo" sin escuchar nada.
app.listen(PORT, (error) => {
    if (error) {
        console.error(`No se pudo iniciar el servidor en el puerto ${PORT}: ${error.message}`);
        process.exit(1);
    }
    console.log(`Servidor de FitPocket corriendo en puerto ${PORT}`);
});
