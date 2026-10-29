const mongoose = require('mongoose');

// Grupo de permisos (compuesto del Composite): junta patentes y también otras familias
const schemaFamilia = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    descripcion: {
        type: String,
        default: ''
    },
    patentes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patente'
    }],
    familias: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Familia'
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Familia', schemaFamilia);
