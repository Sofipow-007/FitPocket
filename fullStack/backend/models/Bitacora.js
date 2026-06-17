const mongoose = require('mongoose');

const schemaBitacora = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    email: {
        type: String,
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

module.exports = mongoose.model('Bitacora', schemaBitacora);