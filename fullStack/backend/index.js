require('dotenv').config();

// Antes que nada: sin las variables obligatorias el backend no arranca
const { problemasDeEntorno } = require('./config/entorno')
const problemas = problemasDeEntorno()
if (problemas.length) {
    const fs = require('fs')
    const path = require('path')
    // Caso típico de un clon nuevo: el .env no viene en el repo, pero sí su versión cifrada
    if (!fs.existsSync(path.join(__dirname, '.env')) && fs.existsSync(path.join(__dirname, '.env.cifrado'))) {
        console.error('Falta el archivo .env. Arrancá con "npm start" (o "npm run dev"): te pide la')
        console.error('contraseña del equipo y lo crea. También sirve "npm run env:abrir".')
        console.error('En Render u otra plataforma, en cambio, faltan estas variables en Environment:')
        for (const p of problemas) console.error(`  - ${p}`)
        process.exit(1)
    }
    console.error('No se puede iniciar el backend. Revisá el .env (o las variables de la plataforma):')
    for (const p of problemas) console.error(`  - ${p}`)
    process.exit(1)
}

const connectDB = require('./config/db')
const { crearEstrategiaIA } = require('./services/ia/iaFactory')
const app = require('./app')
const { ajustarTTLBitacora } = require('./services/indicesService')
const { aplicarAdminsConfigurados } = require('./services/adminsService')

// Un IA_PROVIDER mal escrito se avisa al arrancar y no recién cuando alguien genera un plan
try {
    const ia = crearEstrategiaIA()
    console.log(`Proveedor de IA: ${ia.nombre}`)
} catch (error) {
    console.error(error.message)
    process.exit(1)
}

const conectada = connectDB()
conectada
    .then(() => ajustarTTLBitacora())
    .catch(error => console.error(`No se pudo ajustar el TTL de la bitácora: ${error.message}`))

// ADMIN_EMAILS: las cuentas que ya existen pasan a admin al arrancar
conectada
    .then(() => aplicarAdminsConfigurados())
    .then(({ promovidos, yaEran, sinCuenta }) => {
        for (const e of promovidos) console.log(`ADMIN_EMAILS: ${e} ahora es admin`)
        if (yaEran.length) console.log(`ADMIN_EMAILS: ya eran admin: ${yaEran.join(', ')}`)
        for (const e of sinCuenta) console.log(`ADMIN_EMAILS: ${e} todavía no tiene cuenta; queda como admin al registrarse`)
    })
    .catch(error => console.error(`No se pudieron aplicar los ADMIN_EMAILS: ${error.message}`))

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
