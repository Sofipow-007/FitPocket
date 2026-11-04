// Corre antes de "npm start" y "npm run dev" (prestart / predev). En un clon nuevo no hay
// .env pero sí .env.cifrado: pide la contraseña del equipo y lo crea, así no hay un paso aparte.
// Si ya existe .env, o no hay .env.cifrado, no hace nada.
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..');
const enPlataforma = Boolean(process.env.CI || process.env.RENDER || process.env.NODE_ENV === 'production');

if (fs.existsSync(path.join(DIR, '.env')) || !fs.existsSync(path.join(DIR, '.env.cifrado'))) process.exit(0);

// En Render o un CI nadie puede escribir la contraseña: las variables van en la plataforma
if (enPlataforma && !process.env.FITPOCKET_CLAVE) process.exit(0);

console.log('No hay .env en fullStack/backend. Se crea a partir de .env.cifrado.');
require('./envCifrado').abrir().then(
    () => process.exit(0),
    (error) => {
        console.error(error.message);
        process.exit(1);
    }
);
