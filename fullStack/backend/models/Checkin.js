const mongoose = require('mongoose');

const checkinSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plan',
        required: true
    },
    fecha: {
        type: String, // 'YYYY-MM-DD'
        required: true
    },
    completados: {
        type: [String],
        default: []
    },
    adherencia: {
        type: Number,
        default: 0
    }
}, { 
    timestamps: true
});

checkinSchema.index({
    userId: 1,
    fecha: 1
}, {
    unique: true
});

module.exports = mongoose.model('Checkin', checkinSchema)