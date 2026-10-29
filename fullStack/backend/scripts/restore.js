// Restaura un backup hecho con scripts/backup.js (o desde /admin) y recalcula
// los dígitos verificadores. Reemplaza el contenido de cada colección del backup.
//
// Uso (desde fullStack/backend):
//   node scripts/restore.js                         → el último backup
//   node scripts/restore.js backup_2026-10-28_23-15-00
//   node scripts/restore.js backup_... --si         → sin preguntar (para automatizar)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const readline = require('readline/promises');
const mongoose = require('mongoose');
const { restaurarBackup, ultimoBackup, DIRECTORIO } = require('../services/backupService');

async function confirmar(pregunta) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const respuesta = await rl.question(pregunta);
    rl.close();
    return ['s', 'si', 'sí', 'y', 'yes'].includes(respuesta.trim().toLowerCase());
}

async function main() {
    const args = process.argv.slice(2);
    const sinPreguntar = args.includes('--si');
    const nombre = args.find(a => !a.startsWith('--')) || await ultimoBackup();

    if (!nombre) {
        console.error(`No hay backups en ${DIRECTORIO()}. Generá uno con: node scripts/backup.js`);
        process.exit(1);
    }
    if (!process.env.MONGODB_URI) {
        console.error('Falta MONGODB_URI en fullStack/backend/.env');
        process.exit(1);
    }

    const destino = process.env.MONGODB_URI.replace(/\/\/[^@]*@/, '//***@'); // sin mostrar la contraseña
    console.log(`Se va a restaurar ${nombre} sobre ${destino}.`);
    console.log('Las colecciones del backup se vacían y se cargan con lo que tiene el backup.');
    if (!sinPreguntar && !(await confirmar('¿Seguro? Escribí "si" para continuar: '))) {
        console.log('Restore cancelado. No se cambió nada.');
        return;
    }

    await mongoose.connect(process.env.MONGODB_URI);
    const resultado = await restaurarBackup(nombre);
    for (const c of resultado.restauradas) console.log(`  ${c.nombre}: ${c.documentos} documento(s)`);
    console.log('Dígitos verificadores recalculados.');
    console.log(`Restore completado desde ${nombre}.`);
}

main()
    .catch(err => {
        console.error(`No se pudo restaurar: ${err.message}`);
        process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
