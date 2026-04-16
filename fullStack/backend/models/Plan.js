const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    version: {
        type: Number,
        default: 1
    },
    estado: {
        type: String,
        enum: ['activo', 'archivado'],
        default: 'activo'
    },
    meta: {
        objetivo: String,
        nivel: String,
        tipoDieta: String,
        diasDisponibles: [String],
        minutosPorSesion: Number
    },
    rutina: [{
        dia: String,
        ejercicios: mongoose.Schema.Types.Mixed
    }],
    dieta: [{
        dia: String,
        comida: mongoose.Schema.Types.Mixed
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Plan', planSchema);