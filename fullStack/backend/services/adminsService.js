// Cuentas administradoras configuradas por entorno (ADMIN_EMAILS, separados por coma).
// El email no queda escrito en el repositorio: va en el .env o en las variables de la plataforma.
const User = require('../models/User');
const { familiaBase, FAMILIA_ADMIN } = require('./permisosService');

function emailsAdmin(env = process.env) {
    return [...new Set((env.ADMIN_EMAILS || '')
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(Boolean))];
}

const esEmailAdmin = (email, env = process.env) => emailsAdmin(env).includes(String(email || '').trim().toLowerCase());

// Administrador ya incluye a Usuario, así que reemplaza a las familias que tuviera.
// Devuelve false si ya era admin. El DVH lo recalcula el modelo al guardar.
async function promoverAAdmin(user) {
    const admin = await familiaBase(FAMILIA_ADMIN);
    const yaEsAdmin = user.rol === 'admin' && user.familias.some(f => String(f) === String(admin._id));
    if (yaEsAdmin) return false;
    user.familias = [admin._id];
    user.rol = 'admin';
    await user.save();
    return true;
}

// Al arrancar: hace admin a las cuentas de ADMIN_EMAILS que ya existan. Las que todavía
// no se registraron quedan como admin en el momento del registro (authController).
// Sacar un email de la lista no le quita el rol: eso se hace desde /admin → Familias,
// así un error en la variable no deja al sistema sin administrador.
async function aplicarAdminsConfigurados(env = process.env) {
    const emails = emailsAdmin(env);
    const resultado = { promovidos: [], yaEran: [], sinCuenta: [] };
    for (const email of emails) {
        const user = await User.findOne({ email });
        if (!user) resultado.sinCuenta.push(email);
        else if (await promoverAAdmin(user)) resultado.promovidos.push(email);
        else resultado.yaEran.push(email);
    }
    return resultado;
}

module.exports = { emailsAdmin, esEmailAdmin, promoverAAdmin, aplicarAdminsConfigurados };
