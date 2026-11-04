// Guarda el .env del backend cifrado en el repo (.env.cifrado), protegido con una contraseña
// del equipo. El repositorio es público: el .env en texto plano no se puede subir nunca.
//
//   npm run env:cerrar   → cifra .env en .env.cifrado (después: commit y push)
//   npm run env:abrir    → pide la contraseña y crea .env a partir de .env.cifrado
//
// Sin dependencias externas: lo usa también setup.js, antes de que exista node_modules.
// La contraseña se puede pasar en FITPOCKET_CLAVE para no escribirla (por ejemplo, en un CI).
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..');
const ENV = path.join(DIR, '.env');
const CIFRADO = path.join(DIR, '.env.cifrado');
const LARGO_MINIMO_CLAVE = 12;
// scrypt con costo alto: el archivo es público, así que probar contraseñas tiene que ser caro
const KDF = { N: 2 ** 16, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };

function derivar(clave, salt) {
    return crypto.scryptSync(clave.normalize('NFC'), salt, 32, KDF);
}

function cifrar(texto, clave) {
    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', derivar(clave, salt), iv);
    const datos = Buffer.concat([cipher.update(texto, 'utf8'), cipher.final()]);
    return JSON.stringify({
        formato: 'fitpocket-env-v1', kdf: 'scrypt', N: KDF.N, r: KDF.r, p: KDF.p,
        salt: salt.toString('base64'), iv: iv.toString('base64'),
        tag: cipher.getAuthTag().toString('base64'), datos: datos.toString('base64'),
    }, null, 2) + '\n';
}

// Con una contraseña equivocada AES-GCM falla al verificar el tag: no devuelve basura
function descifrar(contenido, clave) {
    const o = JSON.parse(contenido);
    const clave32 = crypto.scryptSync(clave.normalize('NFC'), Buffer.from(o.salt, 'base64'), 32,
        { N: o.N, r: o.r, p: o.p, maxmem: KDF.maxmem });
    const decipher = crypto.createDecipheriv('aes-256-gcm', clave32, Buffer.from(o.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(o.tag, 'base64'));
    try {
        return Buffer.concat([decipher.update(Buffer.from(o.datos, 'base64')), decipher.final()]).toString('utf8');
    } catch {
        throw new Error('Contraseña incorrecta (o el archivo .env.cifrado está dañado).');
    }
}

// Pide un texto ocultando lo que se escribe. Si la terminal no lo permite (algunas
// configuraciones de Git Bash en Windows), lo pide visible y lo avisa.
function preguntarOculto(pregunta) {
    return new Promise((resolve) => {
        const entrada = process.stdin;
        if (!entrada.isTTY || typeof entrada.setRawMode !== 'function') {
            const rl = require('readline').createInterface({ input: entrada, output: process.stdout });
            rl.question(`${pregunta} (se va a ver lo que escribas) `, (r) => { rl.close(); resolve(r); });
            return;
        }
        process.stdout.write(`${pregunta} `);
        let valor = '';
        entrada.setRawMode(true);
        entrada.resume();
        entrada.setEncoding('utf8');
        const alTipear = (tecla) => {
            for (const c of tecla) {
                if (c === '\r' || c === '\n') {
                    entrada.setRawMode(false);
                    entrada.pause();
                    entrada.removeListener('data', alTipear);
                    process.stdout.write('\n');
                    return resolve(valor);
                }
                if (c === '\u0003') { process.stdout.write('\n'); process.exit(130); }
                if (c === '\u007f' || c === '\b') {
                    if (valor) { valor = valor.slice(0, -1); process.stdout.write('\b \b'); }
                    continue;
                }
                valor += c;
                process.stdout.write('*');
            }
        };
        entrada.on('data', alTipear);
    });
}

async function pedirClave(pregunta) {
    return process.env.FITPOCKET_CLAVE || preguntarOculto(pregunta);
}

// Crea .env desde .env.cifrado. Devuelve true si lo creó.
async function abrir({ pisar = false } = {}) {
    if (!fs.existsSync(CIFRADO)) throw new Error('No existe fullStack/backend/.env.cifrado en el repo.');
    if (fs.existsSync(ENV) && !pisar) {
        console.log('Ya existe fullStack/backend/.env: no se tocó. Borralo si querés volver a crearlo.');
        return false;
    }
    const contenido = fs.readFileSync(CIFRADO, 'utf8');
    for (let intento = 1; intento <= 3; intento++) {
        const clave = await pedirClave('Contraseña del equipo para el .env:');
        try {
            fs.writeFileSync(ENV, descifrar(contenido, clave));
            console.log('Listo: se creó fullStack/backend/.env');
            return true;
        } catch (error) {
            console.error(error.message);
            if (process.env.FITPOCKET_CLAVE) break;
        }
    }
    throw new Error('No se pudo abrir el .env. Pedile la contraseña al equipo.');
}

async function cerrar() {
    if (!fs.existsSync(ENV)) throw new Error('No hay fullStack/backend/.env para cifrar.');
    const clave = await pedirClave(`Contraseña del equipo (mínimo ${LARGO_MINIMO_CLAVE} caracteres):`);
    if (clave.length < LARGO_MINIMO_CLAVE) {
        throw new Error(`La contraseña tiene que tener al menos ${LARGO_MINIMO_CLAVE} caracteres: el archivo se sube a un repo público.`);
    }
    if (!process.env.FITPOCKET_CLAVE && clave !== await preguntarOculto('Repetila:')) {
        throw new Error('Las contraseñas no coinciden. No se cambió nada.');
    }
    fs.writeFileSync(CIFRADO, cifrar(fs.readFileSync(ENV, 'utf8'), clave));
    console.log('Listo: se guardó fullStack/backend/.env.cifrado. Ahora hacé commit y push de ese archivo.');
}

module.exports = { cifrar, descifrar, abrir, cerrar };

if (require.main === module) {
    const comando = process.argv[2];
    const acciones = { abrir: () => abrir({ pisar: process.argv.includes('--pisar') }), cerrar };
    if (!acciones[comando]) {
        console.error('Uso: node scripts/envCifrado.js abrir|cerrar');
        process.exit(1);
    }
    acciones[comando]().catch((error) => { console.error(error.message); process.exit(1); });
}
