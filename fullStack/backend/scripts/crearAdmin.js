// Promueve una cuenta existente a admin. No hay endpoint para esto a propósito:
// el primer admin solo se puede crear con acceso a la base.
//
// Uso (desde fullStack/backend):  node scripts/crearAdmin.js email@ejemplo.com
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const User = require('../models/User');
const { calcularDVH } = require('../utils/digitosVerificadores');
const { decrypt } = require('../utils/crypto');

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
    if (user.rol === 'admin') {
        console.log(`${email} ya es admin. No se cambió nada.`);
        return;
    }

    user.rol = 'admin';

    // El rol entra en el DVH: hay que recalcularlo con los mismos campos que usa la app
    // (register: email, nombre, rol; después del onboarding se suman peso, altura y edad).
    const nombrePlano = decrypt(user.nombre);
    const { peso, altura, edad } = user.perfil || {};
    const hizoOnboarding = peso != null || altura != null || edad != null;
    user.dvh = calcularDVH(
        hizoOnboarding
            ? [user.email, nombrePlano, user.rol, peso, altura, edad]
            : [user.email, nombrePlano, user.rol]
    );

    await user.save();
    console.log(`${email} ahora es admin. Recargá el dashboard para ver el link "Admin".`);
}

main()
    .catch(err => {
        console.error(`No se pudo promover la cuenta: ${err.message}`);
        process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
