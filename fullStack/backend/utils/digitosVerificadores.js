const { decrypt } = require('./crypto');

function calcularDVH(campos) {
    const cadena = campos.map(c => String(c ?? '')).join('|');
    let suma = 0;
    for (let i = 0; i < cadena.length; i++) {
        suma += cadena.charCodeAt(i) * (i + 1);
    }
    return suma % 10000;
}

// Suma de los DVH de una colección (acepta documentos con `dvh` o números sueltos)
function calcularDVV(registros) {
    let suma = 0;
    for (const reg of registros) {
        suma += (typeof reg === 'number' ? reg : reg.dvh) || 0;
    }
    return suma % 100000;
}

// El nombre se guarda cifrado con IV aleatorio: entra al DVH en texto plano para que
// el mismo dato dé siempre el mismo dígito. Si no se puede descifrar (otra CRYPTO_KEY),
// se usa el texto cifrado: igual detecta si alguien lo cambia.
function nombrePlano(nombre) {
    try {
        return decrypt(nombre);
    } catch {
        return nombre;
    }
}

// Única definición de qué campos entran al DVH de cada colección. La usan el plugin
// (al escribir), la verificación y el recálculo, así la lista no se repite.
const CAMPOS_DVH = {
    users: (u) => [u.email, nombrePlano(u.nombre), u.rol, u.perfil?.peso, u.perfil?.altura, u.perfil?.edad],
    plans: (p) => [p.userId, p.estado, p.version, p.meta?.caloriasObjetivoDia],
    checkins: (c) => [c.userId, c.fecha, c.rutina?.estado, c.dieta?.estado, c.puntajeTotal],
};

// Proyección con solo lo que hace falta para recalcular el DVH (más el DVH guardado)
const PROYECCION_DVH = {
    users: 'email nombre rol perfil.peso perfil.altura perfil.edad dvh',
    plans: 'userId estado version meta.caloriasObjetivoDia dvh',
    checkins: 'userId fecha rutina.estado dieta.estado puntajeTotal dvh',
};

function camposDVH(coleccion, doc) {
    const campos = CAMPOS_DVH[coleccion];
    if (!campos) throw new Error(`La colección ${coleccion} no tiene dígitos verificadores`);
    return campos(doc);
}

function dvhDe(coleccion, doc) {
    return calcularDVH(camposDVH(coleccion, doc));
}

const COLECCIONES_DVH = Object.keys(CAMPOS_DVH);

module.exports = { calcularDVH, calcularDVV, camposDVH, dvhDe, COLECCIONES_DVH, PROYECCION_DVH };
