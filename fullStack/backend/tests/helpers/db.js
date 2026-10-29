// Base Mongo en memoria para los tests: nunca se toca Atlas
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let servidor;

async function conectar() {
    servidor = await MongoMemoryServer.create();
    await mongoose.connect(servidor.getUri());
}

async function limpiar() {
    const colecciones = await mongoose.connection.db.collections();
    for (const c of colecciones) await c.deleteMany({});
}

async function desconectar() {
    await mongoose.disconnect();
    if (servidor) await servidor.stop();
}

module.exports = { conectar, limpiar, desconectar };
