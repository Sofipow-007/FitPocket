const mongoose = require('mongoose');

const alertaSchema = new mongoose.Schema({
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tipo:    { type: String, enum: ['baja_adherencia'], default: 'baja_adherencia' },
    mensaje: { type: String, required: true },
    leida:   { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Alerta', alertaSchema);