const mongoose = require('mongoose');

// Permiso atómico (hoja del Composite): habilita una acción concreta, ej. "usuarios.borrar"
const schemaPatente = new mongoose.Schema({
    codigo: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    descripcion: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Patente', schemaPatente);
