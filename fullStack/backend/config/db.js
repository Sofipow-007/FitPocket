const mongoose = require('mongoose');

// Patrón Singleton: una única conexión a Mongo por proceso. Si ya está conectada
// (o conectándose) se devuelve la misma promesa en vez de abrir otra.
let conexion = null;

const connectDB = () => {
    if (conexion) return conexion;

    if (!process.env.MONGODB_URI) {
        console.error('Falta MONGODB_URI en el .env');
        process.exit(1);
    }

    conexion = mongoose.connect(process.env.MONGODB_URI)
        .then(conn => {
            console.log(`MongoDB Conectado: ${conn.connection.host}`);
            return conn.connection;
        })
        .catch(error => {
            console.error(`Error de conexión a MongoDB: ${error.message}`);
            process.exit(1);
        });

    return conexion;
};

module.exports = connectDB;
