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

// DVH de un usuario con los mismos campos que usa la app
// (register: email, nombre, rol; después del onboarding se suman peso, altura y edad).
function dvhDeUsuario(user, nombrePlano) {
    const { peso, altura, edad } = user.perfil || {};
    const hizoOnboarding = peso != null || altura != null || edad != null;
    return calcularDVH(
        hizoOnboarding
            ? [user.email, nombrePlano, user.rol, peso, altura, edad]
            : [user.email, nombrePlano, user.rol]
    );
}

module.exports = { calcularDVH, calcularDVV, dvhDeUsuario };
