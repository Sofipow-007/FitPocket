const Bitacora = require('../models/Bitacora');

// Mongoose crea los índices al arrancar, pero si el índice TTL ya existe con otro
// vencimiento (alguien cambió BITACORA_TTL_DIAS) Mongo no lo recrea: hay que
// ajustarlo con collMod. Sin esto el cambio de la variable no tendría efecto.
async function ajustarTTLBitacora() {
    const esperado = (Number(process.env.BITACORA_TTL_DIAS) || 180) * 86400;
    const indices = await Bitacora.collection.indexes().catch(() => []);
    const ttl = indices.find(i => i.name === 'ttl_createdAt');
    if (!ttl || ttl.expireAfterSeconds === esperado) return false;

    await Bitacora.db.db.command({
        collMod: Bitacora.collection.collectionName,
        index: { name: 'ttl_createdAt', expireAfterSeconds: esperado },
    });
    console.log(`TTL de la bitácora ajustado a ${esperado / 86400} días`);
    return true;
}

module.exports = { ajustarTTLBitacora };
