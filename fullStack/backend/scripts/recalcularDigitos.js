// Recalcula los DVH de usuarios, planes y checkins y el DVV de cada colección.
// Correr una vez sobre datos existentes, después de una migración o de un restore.
//
// Uso (desde fullStack/backend):  node scripts/recalcularDigitos.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const { recalcularTodo } = require('../services/integridadService');

async function main() {
    if (!process.env.MONGODB_URI) {
        console.error('Falta MONGODB_URI en fullStack/backend/.env');
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);

    const resumen = await recalcularTodo();
    for (const r of resumen) {
        console.log(`${r.coleccion}: ${r.totalRegistros} registro(s), ${r.corregidos} DVH corregido(s).`);
    }
    console.log('DVV actualizados.');
}

main()
    .catch(err => {
        console.error(`No se pudieron recalcular los dígitos: ${err.message}`);
        process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
