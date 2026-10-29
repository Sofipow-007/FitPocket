// Pasa los datos cifrados (nombre, limitaciones, aclaración) de una CRYPTO_KEY a otra.
// Sirve para dejar la clave por defecto (que está en el repo) y usar una secreta en producción.
//
// Uso (desde fullStack/backend), con la clave NUEVA ya puesta en CRYPTO_KEY:
//   CRYPTO_KEY_ANTERIOR=fitpocket_default_key_cambiar node scripts/recifrar.js --simular   → solo cuenta
//   CRYPTO_KEY_ANTERIOR=fitpocket_default_key_cambiar node scripts/recifrar.js             → pide confirmación
//
// Antes de correrlo de verdad conviene hacer un backup (node scripts/backup.js).
// Se puede correr más de una vez: lo que ya está con la clave nueva no se toca.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const readline = require('readline/promises');
const mongoose = require('mongoose');
const { recifrarUsuarios } = require('../services/recifradoService');

async function main() {
    const simular = process.argv.includes('--simular');
    const sinPreguntar = process.argv.includes('--si');
    const { MONGODB_URI, CRYPTO_KEY, CRYPTO_KEY_ANTERIOR } = process.env;

    if (!MONGODB_URI || !CRYPTO_KEY || !CRYPTO_KEY_ANTERIOR) {
        console.error('Hacen falta MONGODB_URI, CRYPTO_KEY (la nueva) y CRYPTO_KEY_ANTERIOR.');
        process.exit(1);
    }

    await mongoose.connect(MONGODB_URI);
    const prueba = await recifrarUsuarios({ claveAnterior: CRYPTO_KEY_ANTERIOR, claveNueva: CRYPTO_KEY, simular: true });
    console.log(`Usuarios: ${prueba.usuarios} · a migrar: ${prueba.migrados} · ya con la clave nueva: ${prueba.yaEstaban}`);
    if (prueba.ilegibles.length) {
        console.log(`No abren con ninguna de las dos claves (se dejan como están): ${prueba.ilegibles.join(', ')}`);
    }
    if (simular || prueba.migrados === 0) {
        console.log(simular ? 'Simulación: no se cambió nada.' : 'No hay nada para migrar.');
        return;
    }

    if (!sinPreguntar) {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const respuesta = await rl.question(`¿Re-cifrar ${prueba.migrados} usuario(s)? Escribí "si" para continuar: `);
        rl.close();
        if (!['s', 'si', 'sí'].includes(respuesta.trim().toLowerCase())) {
            console.log('Cancelado. No se cambió nada.');
            return;
        }
    }

    const resultado = await recifrarUsuarios({ claveAnterior: CRYPTO_KEY_ANTERIOR, claveNueva: CRYPTO_KEY });
    console.log(`Listo: ${resultado.migrados} usuario(s) re-cifrados. Desde ahora el backend tiene que usar la CRYPTO_KEY nueva.`);
}

main()
    .catch(err => {
        console.error(`No se pudo re-cifrar: ${err.message}`);
        process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
