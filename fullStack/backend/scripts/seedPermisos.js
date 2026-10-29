// Crea las patentes y familias base y le asigna a cada usuario existente la familia
// Usuario (o Administrador si su rol es admin). Es idempotente: se puede correr varias veces.
//
// Uso (desde fullStack/backend):  node scripts/seedPermisos.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const User = require('../models/User');
const { asegurarPermisosBase, FAMILIA_USUARIO, FAMILIA_ADMIN } = require('../services/permisosService');

async function main() {
    if (!process.env.MONGODB_URI) {
        console.error('Falta MONGODB_URI en fullStack/backend/.env');
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);

    const familias = await asegurarPermisosBase();
    console.log('Patentes y familias base listas.');

    // Solo se tocan cuentas sin familias: a quien ya tenga permisos asignados
    // (por el seed anterior o desde /admin) no se le cambia nada.
    const sinFamilias = { $or: [{ familias: { $exists: false } }, { familias: { $size: 0 } }] };

    const admins = await User.updateMany(
        { ...sinFamilias, rol: 'admin' },
        { $set: { familias: [familias[FAMILIA_ADMIN]._id] } }
    );
    const usuarios = await User.updateMany(
        { ...sinFamilias, rol: { $ne: 'admin' } },
        { $set: { familias: [familias[FAMILIA_USUARIO]._id] } }
    );

    console.log(`Asignada la familia ${FAMILIA_ADMIN} a ${admins.modifiedCount} cuenta(s).`);
    console.log(`Asignada la familia ${FAMILIA_USUARIO} a ${usuarios.modifiedCount} cuenta(s).`);
}

main()
    .catch(err => {
        console.error(`No se pudo sembrar los permisos: ${err.message}`);
        process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
