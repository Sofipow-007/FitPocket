const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
const { EJSON } = require('mongodb').BSON;
const { recalcularTodo } = require('./integridadService');

// Backup lógico multiplataforma: cada colección a un .json con EJSON (conserva
// ObjectId y fechas), sin depender de mongodump ni de bash.
// backups/backup_FECHA/<coleccion>.json + manifest.json

const DIRECTORIO = () => path.resolve(process.env.BACKUP_DIR || path.join(__dirname, '..', 'backups'));
const RETENCION = () => Math.max(1, Number(process.env.BACKUP_RETENCION) || 7);
const NOMBRE_VALIDO = /^backup_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/;

// Fecha local (Argentina) para el nombre de la carpeta: backup_2026-10-28_23-15-00
function nombreParaFecha(fecha = new Date()) {
    const partes = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Argentina/Buenos_Aires',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }).formatToParts(fecha).reduce((o, p) => ({ ...o, [p.type]: p.value }), {});
    return `backup_${partes.year}-${partes.month}-${partes.day}_${partes.hour}-${partes.minute}-${partes.second}`;
}

async function coleccionesDeLaBase(db) {
    const lista = await db.listCollections({ type: 'collection' }).toArray();
    return lista.map(c => c.name).filter(n => !n.startsWith('system.')).sort();
}

async function crearBackup({ db = mongoose.connection.db } = {}) {
    let nombre = nombreParaFecha();
    const base = DIRECTORIO();
    // dos backups en el mismo segundo (doble click): se espera al siguiente
    while (await existe(path.join(base, nombre))) {
        await new Promise(r => setTimeout(r, 1000));
        nombre = nombreParaFecha();
    }
    const carpeta = path.join(base, nombre);
    await fs.mkdir(carpeta, { recursive: true });

    const colecciones = [];
    for (const coleccion of await coleccionesDeLaBase(db)) {
        const docs = await db.collection(coleccion).find().toArray();
        await fs.writeFile(path.join(carpeta, `${coleccion}.json`), EJSON.stringify(docs, { relaxed: false }));
        colecciones.push({ nombre: coleccion, documentos: docs.length });
    }

    const manifest = { version: 1, nombre, creadoEn: new Date().toISOString(), colecciones };
    await fs.writeFile(path.join(carpeta, 'manifest.json'), JSON.stringify(manifest, null, 2));

    const borrados = await aplicarRetencion();
    return { ...manifest, bytes: await tamanio(carpeta), borrados };
}

// Se conservan los últimos BACKUP_RETENCION backups (7 por defecto)
async function aplicarRetencion() {
    const todos = await nombresDeBackups();
    const sobran = todos.slice(0, Math.max(0, todos.length - RETENCION()));
    for (const nombre of sobran) {
        await fs.rm(path.join(DIRECTORIO(), nombre), { recursive: true, force: true });
    }
    return sobran;
}

// Nombres válidos ordenados del más viejo al más nuevo (el nombre lleva la fecha)
async function nombresDeBackups() {
    const entradas = await fs.readdir(DIRECTORIO(), { withFileTypes: true }).catch(() => []);
    return entradas.filter(e => e.isDirectory() && NOMBRE_VALIDO.test(e.name)).map(e => e.name).sort();
}

async function listarBackups() {
    const lista = [];
    for (const nombre of (await nombresDeBackups()).reverse()) {
        const carpeta = path.join(DIRECTORIO(), nombre);
        const manifest = await leerManifest(carpeta).catch(() => null);
        lista.push({
            nombre,
            creadoEn: manifest?.creadoEn ?? null,
            colecciones: manifest?.colecciones.length ?? 0,
            documentos: manifest?.colecciones.reduce((n, c) => n + c.documentos, 0) ?? 0,
            bytes: await tamanio(carpeta),
            valido: Boolean(manifest),
        });
    }
    return lista;
}

// Restaura un backup: cada colección del backup se vacía y se vuelve a cargar.
// Las colecciones que no están en el backup no se tocan. Al final recalcula los
// dígitos verificadores, porque los DVV guardados pueden no coincidir con lo restaurado.
async function restaurarBackup(nombre, { db = mongoose.connection.db } = {}) {
    if (!NOMBRE_VALIDO.test(nombre)) throw new Error(`Nombre de backup inválido: ${nombre}`);
    const carpeta = path.join(DIRECTORIO(), nombre);
    const manifest = await leerManifest(carpeta);

    const restauradas = [];
    for (const { nombre: coleccion } of manifest.colecciones) {
        const docs = EJSON.parse(await fs.readFile(path.join(carpeta, `${coleccion}.json`), 'utf8'), { relaxed: false });
        // deleteMany y no drop: así se conservan los índices de la colección
        await db.collection(coleccion).deleteMany({});
        if (docs.length) await db.collection(coleccion).insertMany(docs, { ordered: false });
        restauradas.push({ nombre: coleccion, documentos: docs.length });
    }

    const digitos = await recalcularTodo();
    return { nombre, restauradas, digitos };
}

async function ultimoBackup() {
    const todos = await nombresDeBackups();
    return todos[todos.length - 1] ?? null;
}

async function leerManifest(carpeta) {
    const manifest = JSON.parse(await fs.readFile(path.join(carpeta, 'manifest.json'), 'utf8'));
    if (!Array.isArray(manifest.colecciones)) throw new Error('manifest.json incompleto');
    return manifest;
}

async function existe(ruta) {
    return fs.access(ruta).then(() => true, () => false);
}

async function tamanio(carpeta) {
    const archivos = await fs.readdir(carpeta).catch(() => []);
    let total = 0;
    for (const a of archivos) total += (await fs.stat(path.join(carpeta, a)).catch(() => ({ size: 0 }))).size;
    return total;
}

module.exports = { crearBackup, listarBackups, restaurarBackup, ultimoBackup, aplicarRetencion, nombreParaFecha, DIRECTORIO, RETENCION };
