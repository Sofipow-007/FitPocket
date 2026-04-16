const mongoose = require('mongoose');

const connectDB = async () => {
    // Añade esta línea para depurar:
    console.log("URI cargada:", process.env.MONGODB_URI ? "SÍ" : "NO"); 

    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Conectado: ${conn.connection.host}`);
    } catch (error){
        console.error(`Error de conexión a MongoDB: ${error.message}`);
        process.exit(1);
    }
};
module.exports = connectDB;

// username: powersofiaet36_db_user
// password: q3Nw8vJ9txXk9hnS