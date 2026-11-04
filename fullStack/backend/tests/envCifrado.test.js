const { cifrar, descifrar } = require('../scripts/envCifrado');

const ENV = 'MONGODB_URI=mongodb://usuario:contraseña@host/fitpocket\nCRYPTO_KEY=ñandú-123\n';

describe('.env cifrado', () => {
    test('ida y vuelta con la contraseña correcta, sin perder acentos', () => {
        expect(descifrar(cifrar(ENV, 'contraseña-del-equipo'), 'contraseña-del-equipo')).toBe(ENV);
    });

    test('con otra contraseña falla en vez de devolver basura', () => {
        const archivo = cifrar(ENV, 'contraseña-del-equipo');
        expect(() => descifrar(archivo, 'otra-contraseña-x')).toThrow('Contraseña incorrecta');
    });

    test('el archivo no contiene nada del .env en texto plano', () => {
        const archivo = cifrar(ENV, 'contraseña-del-equipo');
        expect(archivo).not.toMatch(/MONGODB_URI|CRYPTO_KEY|mongodb:\/\/|contraseña|ñandú/);
    });

    test('cada cifrado usa salt e IV nuevos', () => {
        const a = JSON.parse(cifrar(ENV, 'contraseña-del-equipo'));
        const b = JSON.parse(cifrar(ENV, 'contraseña-del-equipo'));
        expect(a.salt).not.toBe(b.salt);
        expect(a.iv).not.toBe(b.iv);
    });
});
