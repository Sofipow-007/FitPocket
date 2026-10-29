const mongoose = require('mongoose');
const { encryptCon, decryptCon, derivarClave } = require('../utils/crypto');

// Campos de users que se guardan cifrados con CRYPTO_KEY
const CAMPOS = ['nombre', 'perfil.aclaracion', 'perfil.limitaciones'];

const leer = (doc, ruta) => ruta.split('.').reduce((o, k) => o?.[k], doc);

// Con la clave equivocada AES-CBC suele tirar error, pero ~1 de cada 256 veces el
// relleno "cierra" por casualidad y devuelve basura. Se exige que el resultado sea
// texto válido: sin caracteres de reemplazo (UTF-8 roto) ni de control.
const TEXTO_INVALIDO = /[�\u0000-\u0008\u000B\u000C\u000E-\u001F]/; // eslint-disable-line no-control-regex

function intentar(fn) {
    try {
        const valor = fn();
        return TEXTO_INVALIDO.test(valor) ? { ok: false } : { ok: true, valor };
    } catch {
        return { ok: false };
    }
}

// Pasa un valor cifrado de la clave anterior a la nueva.
// - 'migrado': se descifró con la anterior y se volvió a cifrar con la nueva
// - 'yaEstaba': ya estaba con la nueva (el script se puede correr dos veces)
// - 'ilegible': no abre con ninguna de las dos claves (se deja como está)
function recifrarValor(valor, anterior, nueva) {
    if (!valor || typeof valor !== 'string' || !valor.includes(':')) return { estado: 'sinCifrar', valor };
    const conNueva = intentar(() => decryptCon(nueva, valor));
    if (conNueva.ok) return { estado: 'yaEstaba', valor };
    const conAnterior = intentar(() => decryptCon(anterior, valor));
    if (!conAnterior.ok) return { estado: 'ilegible', valor };
    return { estado: 'migrado', valor: encryptCon(nueva, conAnterior.valor) };
}

// Re-cifra todos los usuarios. Con simular: true no escribe nada, solo cuenta.
// El DVH no cambia: se calcula con el nombre descifrado, que es el mismo.
async function recifrarUsuarios({ claveAnterior, claveNueva, simular = false, db = mongoose.connection.db }) {
    if (!claveAnterior || !claveNueva) throw new Error('Faltan la clave anterior o la nueva');
    if (claveAnterior === claveNueva) throw new Error('La clave anterior y la nueva son iguales: no hay nada que hacer');

    const anterior = derivarClave(claveAnterior);
    const nueva = derivarClave(claveNueva);
    const resumen = { usuarios: 0, migrados: 0, yaEstaban: 0, ilegibles: [] };
    const ops = [];

    const cursor = db.collection('users').find({}, { projection: { email: 1, nombre: 1, 'perfil.aclaracion': 1, 'perfil.limitaciones': 1 } });
    for await (const user of cursor) {
        resumen.usuarios++;
        const cambios = {};
        let ilegible = false;

        for (const campo of CAMPOS) {
            const actual = leer(user, campo);
            if (Array.isArray(actual)) {
                const resultados = actual.map(v => recifrarValor(v, anterior, nueva));
                if (resultados.some(r => r.estado === 'ilegible')) ilegible = true;
                if (resultados.some(r => r.estado === 'migrado')) cambios[campo] = resultados.map(r => r.valor);
            } else {
                const r = recifrarValor(actual, anterior, nueva);
                if (r.estado === 'ilegible') ilegible = true;
                if (r.estado === 'migrado') cambios[campo] = r.valor;
            }
        }

        if (ilegible) resumen.ilegibles.push(user.email);
        if (Object.keys(cambios).length) {
            resumen.migrados++;
            ops.push({ updateOne: { filter: { _id: user._id }, update: { $set: cambios } } });
        } else if (!ilegible) {
            resumen.yaEstaban++;
        }
    }

    if (!simular && ops.length) await db.collection('users').bulkWrite(ops);
    return resumen;
}

module.exports = { recifrarUsuarios, recifrarValor };
