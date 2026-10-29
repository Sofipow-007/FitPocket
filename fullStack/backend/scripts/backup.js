// Backup de todas las colecciones a backups/backup_FECHA/*.json (EJSON).
// Funciona en Windows, Linux y Mac sin mongodump. Conserva los últimos BACKUP_RETENCION (7).
//
// Uso (desde fullStack/backend):  node scripts/backup.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const { crearBackup, DIRECTORIO } = require('../services/backupService');

async function main() {
    if (!process.env.MONGODB_URI) {
        console.error('Falta MONGODB_URI en fullStack/backend/.env');
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);

    const backup = await crearBackup();
    for (const c of backup.colecciones) console.log(`  ${c.nombre}: ${c.documentos} documento(s)`);
    console.log(`Backup guardado en ${path.join(DIRECTORIO(), backup.nombre)} (${(backup.bytes / 1024).toFixed(1)} KB)`);
    if (backup.borrados.length) console.log(`Se borraron backups viejos: ${backup.borrados.join(', ')}`);
}

main()
    .catch(err => {
        console.error(`No se pudo hacer el backup: ${err.message}`);
        process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
