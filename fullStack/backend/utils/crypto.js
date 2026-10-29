const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';

// La clave AES se deriva de CRYPTO_KEY con SHA-256 (32 bytes, lo que pide AES-256).
// Se calcula al usarla y no al importar el módulo: así los scripts que cargan el
// .env después de los require también la encuentran.
function derivarClave(texto) {
    return crypto.createHash('sha256').update(texto).digest();
}

function claveActual() {
    if (!process.env.CRYPTO_KEY) {
        throw new Error('Falta CRYPTO_KEY: sin ella no se pueden cifrar ni descifrar los datos.');
    }
    return derivarClave(process.env.CRYPTO_KEY);
}

function encryptCon(clave, text) {
    if (!text) return text;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, clave, iv);
    let encrypted = cipher.update(String(text), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

function decryptCon(clave, text) {
    if (!text || !text.includes(':')) return text;
    const [ivHex, encrypted] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, clave, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

const encrypt = (text) => encryptCon(claveActual(), text);
const decrypt = (text) => decryptCon(claveActual(), text);

module.exports = { encrypt, decrypt, encryptCon, decryptCon, derivarClave };
