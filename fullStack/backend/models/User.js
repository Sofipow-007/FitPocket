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
                'keto'
            ]
        },

        presupuesto: {
            type: Number
        },
        limitaciones: [{
            type: String
        }]
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', schemaUser)