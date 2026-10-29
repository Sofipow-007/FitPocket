// Revisa las variables de entorno antes de arrancar. Mejor no arrancar que arrancar
// con una clave por defecto: con JWT_SECRET vacío cualquiera firmaría tokens, y con
// CRYPTO_KEY por defecto los datos cifrados se leerían con una clave que está en el repo.

// Valores que aparecen en .env.example o en versiones viejas del código: en producción no sirven
const CLAVES_PUBLICAS = [
    'una-clave-larga-y-aleatoria',
    'otra-clave-larga-y-aleatoria',
    'fitpocket_default_key_cambiar',
];
const LARGO_MINIMO_PRODUCCION = 32;

function esProduccion() {
    return process.env.NODE_ENV === 'production';
}

// Devuelve la lista de problemas (vacía si está todo bien)
function problemasDeEntorno(env = process.env) {
    const problemas = [];
    const produccion = env.NODE_ENV === 'production';

    for (const nombre of ['MONGODB_URI', 'JWT_SECRET', 'CRYPTO_KEY']) {
        if (!env[nombre]?.trim()) problemas.push(`Falta ${nombre}.`);
    }

    if (produccion) {
        if (!env.FRONTEND_URL?.trim()) {
            problemas.push('Falta FRONTEND_URL: hace falta para CORS y para los enlaces de recuperación de contraseña.');
        }
        for (const nombre of ['JWT_SECRET', 'CRYPTO_KEY']) {
            const valor = env[nombre]?.trim();
            if (!valor) continue;
            if (CLAVES_PUBLICAS.includes(valor)) {
                problemas.push(`${nombre} usa un valor que está publicado en el repositorio. Generá uno nuevo` +
                    (nombre === 'CRYPTO_KEY' ? ' y pasá los datos con scripts/recifrar.js.' : '.'));
            } else if (valor.length < LARGO_MINIMO_PRODUCCION) {
                problemas.push(`${nombre} tiene que tener al menos ${LARGO_MINIMO_PRODUCCION} caracteres en producción.`);
            }
        }
        if (env.JWT_SECRET && env.JWT_SECRET === env.CRYPTO_KEY) {
            problemas.push('JWT_SECRET y CRYPTO_KEY tienen que ser distintas.');
        }
    }
    return problemas;
}

// Orígenes que pueden llamar a la API desde el navegador (CORS)
function origenesPermitidos(env = process.env) {
    const configurados = (env.FRONTEND_URL || '')
        .split(',')
        .map(u => u.trim().replace(/\/+$/, ''))
        .filter(Boolean);
    if (env.NODE_ENV === 'production') return configurados;
    return [...new Set([...configurados, 'http://localhost:5173', 'http://127.0.0.1:5173'])];
}

module.exports = { problemasDeEntorno, origenesPermitidos, esProduccion, CLAVES_PUBLICAS };
