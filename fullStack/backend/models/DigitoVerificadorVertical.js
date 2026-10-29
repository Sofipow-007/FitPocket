const mongoose = require('mongoose');

// Un DVV por colección: la suma de los DVH de todos sus registros.
// Si alguien agrega, borra o modifica filas por fuera de la app, deja de coincidir.
const schemaDVV = new mongoose.Schema({
    coleccion: {
        type: String,
        required: true,
        unique: true
    },
    dvv: {
        type: Number,
        required: true
    },
    actualizadoEn: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('DigitoVerificadorVertical', schemaDVV, 'digitosverificadoresverticales');
