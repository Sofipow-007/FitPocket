const mongoose = require('mongoose');
const digitosVerificadores = require('./plugins/digitosVerificadores');

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

    // Se deriva de las familias (tiene "Administrador" → 'admin'); se conserva
    // porque lo usan el front, el DVH y el chequeo de "no borrar admins".
    rol: {
        type: String,
        enum: ['usuario', 'admin'],
        default: 'usuario'
    },

    // Permisos: familias asignadas y patentes sueltas. Los efectivos son la unión recursiva.
    familias: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Familia'
    }],
    patentes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patente'
    }],

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
    }
}, {
    timestamps: true
});

// Agrega `dvh` y mantiene el DVH y el DVV en cada escritura
schemaUser.plugin(digitosVerificadores, { coleccion: 'users' });

module.exports = mongoose.model('User', schemaUser)