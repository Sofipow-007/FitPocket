const mongoose = require('mongoose');
const digitosVerificadores = require('./plugins/digitosVerificadores');

const ESTADOS = ['completado', 'parcial', 'no_hice'];

const checkinSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
    fecha:  { type: String, required: true }, // 'YYYY-MM-DD'
    rutina: {
        estado:  { type: String, enum: ESTADOS, default: 'no_hice' },
        puntaje: { type: Number, default: 0 }
    },
    dieta: {
        estado:  { type: String, enum: ESTADOS, default: 'no_hice' },
        puntaje: { type: Number, default: 0 }
    },
    puntajeTotal: { type: Number, default: 0 }
}, { timestamps: true });

checkinSchema.index({ userId: 1, fecha: 1 }, { unique: true });

// Agrega `dvh` y mantiene el DVH y el DVV en cada escritura
checkinSchema.plugin(digitosVerificadores, { coleccion: 'checkins' });

module.exports = mongoose.model('Checkin', checkinSchema);