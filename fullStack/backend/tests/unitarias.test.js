// Pruebas unitarias: funciones puras, sin base de datos ni servidor
const { encrypt, decrypt } = require('../utils/crypto');
const { calcularDVH, calcularDVV, dvhDe } = require('../utils/digitosVerificadores');
const { filtrarContraindicados, normalizarDia } = require('../controllers/planController');

describe('crypto (AES-256-CBC)', () => {
    test('encriptar y desencriptar devuelve el texto original', () => {
        const textos = ['Ana', 'María José Núñez', 'lumbar', '🏋️ emojis también', 'a'.repeat(500)];
        for (const t of textos) expect(decrypt(encrypt(t))).toBe(t);
    });

    test('el mismo texto da un cifrado distinto cada vez (IV aleatorio)', () => {
        const a = encrypt('Ana');
        const b = encrypt('Ana');
        expect(a).not.toBe(b);
        expect(a).toMatch(/^[0-9a-f]{32}:[0-9a-f]+$/);
    });

    test('valores vacíos o sin cifrar pasan sin cambios', () => {
        expect(encrypt('')).toBe('');
        expect(encrypt(null)).toBeNull();
        expect(decrypt('texto plano viejo')).toBe('texto plano viejo');
    });

    test('un cifrado alterado no se descifra en silencio', () => {
        const [iv, datos] = encrypt('Ana').split(':');
        const alterado = `${iv}:${datos.slice(0, -2)}00`;
        let resultado;
        try { resultado = decrypt(alterado); } catch { resultado = 'error'; }
        expect(resultado).not.toBe('Ana');
    });
});

describe('dígitos verificadores', () => {
    test('el DVH es determinista y cambia si cambia un campo', () => {
        const campos = ['a@b.com', 'Ana', 'usuario', 70, 170, 30];
        expect(calcularDVH(campos)).toBe(calcularDVH([...campos]));
        expect(calcularDVH(campos)).not.toBe(calcularDVH(['a@b.com', 'Ana', 'usuario', 71, 170, 30]));
        expect(calcularDVH(campos)).toBeGreaterThanOrEqual(0);
        expect(calcularDVH(campos)).toBeLessThan(10000);
    });

    test('el orden de los campos importa (no es una suma simple)', () => {
        expect(calcularDVH(['ab', 'cd'])).not.toBe(calcularDVH(['cd', 'ab']));
    });

    test('null y undefined cuentan igual que vacío', () => {
        expect(calcularDVH([null, undefined])).toBe(calcularDVH(['', '']));
    });

    test('el DVV suma los DVH y se mantiene en 5 dígitos', () => {
        expect(calcularDVV([{ dvh: 10 }, { dvh: 20 }, 30])).toBe(60);
        expect(calcularDVV(Array(30).fill({ dvh: 9999 }))).toBe((30 * 9999) % 100000);
    });

    test('dvhDe usa los campos de cada colección', () => {
        const checkin = { userId: 'u1', fecha: '2026-10-29', rutina: { estado: 'completado' }, dieta: { estado: 'parcial' }, puntajeTotal: 1.5 };
        expect(dvhDe('checkins', checkin)).toBe(calcularDVH(['u1', '2026-10-29', 'completado', 'parcial', 1.5]));
        // un campo que no entra al DVH no lo cambia
        expect(dvhDe('checkins', { ...checkin, planId: 'otro' })).toBe(dvhDe('checkins', checkin));
    });
});

describe('planController: red de seguridad sobre la IA', () => {
    const rutina = [{
        dia: 'lunes',
        ejercicios: [
            { nombre: 'Sentadilla con salto', alternativas: [{ nombre: 'Burpees' }, { nombre: 'Sentadilla a la caja' }] },
            { nombre: 'Zancada con salto', alternativas: [] },
            { nombre: 'Remo con mancuerna', alternativas: [{ nombre: 'Jumping jacks' }] },
        ],
    }];

    test('con rodilla reemplaza por la primera alternativa permitida o saca el ejercicio', () => {
        const [lunes] = filtrarContraindicados(rutina, ['rodilla']);
        expect(lunes.ejercicios.map(e => e.nombre)).toEqual(['Sentadilla a la caja', 'Remo con mancuerna']);
        // las alternativas contraindicadas también se sacan
        expect(lunes.ejercicios[1].alternativas).toEqual([]);
    });

    test('sin limitaciones no toca la rutina', () => {
        expect(filtrarContraindicados(rutina, [])).toBe(rutina);
    });

    test('una limitación sin reglas (asma) no saca nada', () => {
        const [lunes] = filtrarContraindicados(rutina, ['asma']);
        expect(lunes.ejercicios).toHaveLength(3);
    });

    test('normalizarDia ignora tildes, mayúsculas y espacios', () => {
        expect(normalizarDia(' Miércoles ')).toBe('miercoles');
        expect(normalizarDia('SÁBADO')).toBe('sabado');
        expect(normalizarDia(undefined)).toBe('');
    });
});
