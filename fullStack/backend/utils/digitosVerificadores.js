function calcularDVH(campos) {
    const cadena = campos.map(c => String(c ?? '')).join('|');
    let suma = 0;
    for (let i = 0; i < cadena.length; i++) {
        suma += cadena.charCodeAt(i) * (i + 1);
    }
    return suma % 10000;
}

function calcularDVV(registros) {
    let suma = 0;
    for (const reg of registros) {
        suma += (reg.dvh || 0);
    }
    return suma % 100000;
}

module.exports = { calcularDVH, calcularDVV };