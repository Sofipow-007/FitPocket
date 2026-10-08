const mongoose = require('mongoose');

const schemaUser = new mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    passwordHash: {
        type: String,
        required: true
    },

    // Recuperación de contraseña: del token solo se guarda el hash
    resetTokenHash:     { type: String },
    resetTokenExpira:   { type: Date },
    resetPedidoEn:      { type: Date },
    // Las sesiones (JWT) emitidas antes de esta fecha dejan de valer
    passwordCambiadaEn: { type: Date },

    rol: {
        type: String,
        enum: ['usuario', 'admin'],
        default: 'usuario'
    },

    perfil: {
        peso: {
            type: Number
        },
        altura: {
            type: Number
        },
        edad: {
            type: Number
        },
        sexo: {
            type: String
        },
        objetivo: {
            type: String,
            enum: [
                'perder grasa',
                'ganar músculo',
                'resistencia',
                'salud general',
                'mejorar dieta/bienestar'
            ]
        },
        nivel: {
            type: String,
            enum: [
                'principiante',
                'intermedio',
                'avanzado'
            ]
        },
        diasDispo: [{
            type: String
        }],
        minutosPorSesion: {
            type: Number
        },
        tipoDieta: {
            type: String,
            enum: [
                'normal',
                'vegana',
                'vegetariana',
                'keto',
                'singluten'
            ]
        },

        presupuesto: {
            type: Number
        },
        limitaciones: [{
            type: String
        }],
        aclaracion: {
            type: String
        }
    },
    dvh: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', schemaUser)