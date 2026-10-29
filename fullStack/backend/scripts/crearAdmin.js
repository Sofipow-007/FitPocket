// Promueve una cuenta existente a admin asignándole la familia Administrador.
// No hay endpoint para esto a propósito: el primer admin solo se puede crear con acceso a la base.
//
// Uso (desde fullStack/backend):  node scripts/crearAdmin.js email@ejemplo.com
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const User = require('../models/User');
const { dvhDeUsuario } = require('../utils/digitosVerificadores');
const { decrypt } = require('../utils/crypto');
const { familiaBase, FAMILIA_ADMIN } = require('../services/permisosService');

async function main() {
    const email = (process.argv[2] || '').trim().toLowerCase();
    if (!email) {
        console.error('Falta el email. Uso: node scripts/crearAdmin.js email@ejemplo.com');
        process.exit(1);
    }
    if (!process.env.MONGODB_URI) {
        console.error('Falta MONGODB_URI en fullStack/backend/.env');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const user = await User.findOne({ email });
    if (!user) {
        console.error(`No existe ninguna cuenta con el email ${email}. Registrala primero desde la app.`);
        process.exit(1);
    }

    // Administrador ya incluye a Usuario, así que reemplaza a las familias que tuviera
    const admin = await familiaBase(FAMILIA_ADMIN);
    const yaEsAdmin = user.rol === 'admin' && user.familias.some(f => String(f) === String(admin._id));
    if (yaEsAdmin) {
        console.log(`${email} ya es admin. No se cambió nada.`);
        return;
    }

    user.familias = [admin._id];
    user.rol = 'admin';
    // El rol entra en el DVH: hay que recalcularlo
    user.dvh = dvhDeUsuario(user, decrypt(user.nombre));

    await user.save();
    console.log(`${email} ahora es admin. Recargá el dashboard para ver el link "Admin".`);
}

main()
    .catch(err => {
        console.error(`No se pudo promover la cuenta: ${err.message}`);
        process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
