const mongoose = require('mongoose');

const schemaBitacora = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    accion: {
        type: String,
        required: true
    },
    metodo: {
        type: String,
        required: true
    },
    ruta: {
        type: String,
        required: true
    },
    ip: {
        type: String
    },
    detalles: {
        type: String,
        default: null
    },
    statusCode: {
        type: Number
    }
}, {
    timestamps: true
});

// Partición temporal: Mongo borra solo los registros más viejos que BITACORA_TTL_DIAS.
// El mismo índice sirve para ordenar por fecha (en cualquier sentido) en el listado.
const TTL_DIAS = Number(process.env.BITACORA_TTL_DIAS) || 180;
schemaBitacora.index({ createdAt: 1 }, { expireAfterSeconds: TTL_DIAS * 86400, name: 'ttl_createdAt' });
// Filtro por usuario ordenado por fecha (pestaña Bitácora del admin)
schemaBitacora.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Bitacora', schemaBitacora);