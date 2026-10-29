require('dotenv').config();

// Antes que nada: sin las variables obligatorias el backend no arranca
const { problemasDeEntorno } = require('./config/entorno')
const problemas = problemasDeEntorno()
if (problemas.length) {
    console.error('No se puede iniciar el backend. Revisá el .env (o las variables de la plataforma):')
    for (const p of problemas) console.error(`  - ${p}`)
    process.exit(1)
}

const connectDB = require('./config/db')
const { crearEstrategiaIA } = require('./services/ia/iaFactory')
const app = require('./app')
const { ajustarTTLBitacora } = require('./services/indicesService')

// Un IA_PROVIDER mal escrito se avisa al arrancar y no recién cuando alguien genera un plan
try {
    const ia = crearEstrategiaIA()
    console.log(`Proveedor de IA: ${ia.nombre}`)
} catch (error) {
    console.error(error.message)
    process.exit(1)
}

connectDB()
    .then(() => ajustarTTLBitacora())
    .catch(error => console.error(`No se pudo ajustar el TTL de la bitácora: ${error.message}`))

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
