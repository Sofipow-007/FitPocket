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
        duracionSemanas: Number,
        caloriasObjetivoDia: Number,
        nivelDificultad: { type: String, enum: ['principiante', 'intermedio', 'avanzado'] },
        justificacion: String,
        tipoDieta: String,
        diasDisponibles: [String],
        minutosPorSesion: Number,
        presupuestoMensual: Number
    },
    rutina: [{
        dia: String,
        tipo: String,
        duracionMinutos: Number,
        ejercicios: mongoose.Schema.Types.Mixed
    }],
    dieta: [{
        dia: String,
        comida: mongoose.Schema.Types.Mixed,
        costoEstimadoDia: Number
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Plan', planSchema);