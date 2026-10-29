// Configuración de despliegue: variables obligatorias, CORS, chequeo de salud y re-cifrado
const request = require('supertest');
const app = require('../app');
const db = require('./helpers/db');
const Bitacora = require('../models/Bitacora');
const { problemasDeEntorno, origenesPermitidos } = require('../config/entorno');
const { encryptCon, decryptCon, derivarClave, encrypt } = require('../utils/crypto');
const { recifrarUsuarios, recifrarValor } = require('../services/recifradoService');

const SEGURA = 'x'.repeat(40);
const BASE_PROD = { NODE_ENV: 'production', MONGODB_URI: 'mongodb://x', JWT_SECRET: SEGURA, CRYPTO_KEY: 'y'.repeat(40), FRONTEND_URL: 'https://fitpocket.vercel.app' };

describe('variables de entorno', () => {
    test('sin MONGODB_URI, JWT_SECRET o CRYPTO_KEY no arranca', () => {
        expect(problemasDeEntorno({})).toEqual(['Falta MONGODB_URI.', 'Falta JWT_SECRET.', 'Falta CRYPTO_KEY.']);
        expect(problemasDeEntorno({ MONGODB_URI: 'x', JWT_SECRET: '  ', CRYPTO_KEY: 'z' })).toEqual(['Falta JWT_SECRET.']);
    });

    test('en desarrollo alcanza con que estén', () => {
        expect(problemasDeEntorno({ MONGODB_URI: 'x', JWT_SECRET: 'corta', CRYPTO_KEY: 'fitpocket_default_key_cambiar' })).toEqual([]);
    });

    test('una configuración de producción correcta pasa', () => {
        expect(problemasDeEntorno(BASE_PROD)).toEqual([]);
    });

    test('en producción exige FRONTEND_URL, claves largas, distintas y no publicadas', () => {
        const sinFront = problemasDeEntorno({ ...BASE_PROD, FRONTEND_URL: '' });
        expect(sinFront.join()).toMatch(/FRONTEND_URL/);

        const corta = problemasDeEntorno({ ...BASE_PROD, JWT_SECRET: 'corta' });
        expect(corta.join()).toMatch(/JWT_SECRET tiene que tener al menos 32/);

        const porDefecto = problemasDeEntorno({ ...BASE_PROD, CRYPTO_KEY: 'fitpocket_default_key_cambiar' });
        expect(porDefecto.join()).toMatch(/CRYPTO_KEY usa un valor que está publicado.*recifrar/);

        const iguales = problemasDeEntorno({ ...BASE_PROD, CRYPTO_KEY: SEGURA });
        expect(iguales.join()).toMatch(/distintas/);
    });

    test('orígenes de CORS: los de FRONTEND_URL, y en desarrollo también localhost', () => {
        expect(origenesPermitidos({ NODE_ENV: 'production', FRONTEND_URL: 'https://a.app/, https://b.app' })).toEqual(['https://a.app', 'https://b.app']);
        expect(origenesPermitidos({})).toEqual(['http://localhost:5173', 'http://127.0.0.1:5173']);
    });

    test('sin CRYPTO_KEY no se cifra con una clave por defecto', () => {
        const anterior = process.env.CRYPTO_KEY;
        delete process.env.CRYPTO_KEY;
        try {
            expect(() => encrypt('Ana')).toThrow('Falta CRYPTO_KEY');
        } finally {
            process.env.CRYPTO_KEY = anterior;
        }
    });
});

describe('CORS y salud', () => {
    beforeAll(db.conectar);
    afterAll(db.desconectar);

    test('el front permitido recibe los encabezados CORS', async () => {
        const res = await request(app).get('/salud').set('Origin', 'http://localhost:5173');
        expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });

    test('otro sitio no: el navegador bloquea la respuesta', async () => {
        const res = await request(app).get('/salud').set('Origin', 'https://sitio-malicioso.com');
        expect(res.headers['access-control-allow-origin']).toBeUndefined();
        const preflight = await request(app).options('/auth/login')
            .set('Origin', 'https://sitio-malicioso.com')
            .set('Access-Control-Request-Method', 'POST');
        expect(preflight.headers['access-control-allow-origin']).toBeUndefined();
    });

    test('/salud responde sin token y no llena la bitácora', async () => {
        const res = await request(app).get('/salud');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ ok: true });
        await new Promise(r => setTimeout(r, 50));
        expect(await Bitacora.countDocuments({ ruta: '/salud' })).toBe(0);
    });
});

describe('re-cifrado de CRYPTO_KEY', () => {
    beforeAll(db.conectar);
    afterEach(db.limpiar);
    afterAll(db.desconectar);

    const VIEJA = 'fitpocket_default_key_cambiar';
    const NUEVA = 'una-clave-nueva-y-secreta-de-produccion-123';

    test('pasa nombre, limitaciones y aclaración a la clave nueva, y se puede correr dos veces', async () => {
        const vieja = derivarClave(VIEJA);
        const users = require('mongoose').connection.db.collection('users');
        await users.insertOne({
            email: 'ana@test.com',
            nombre: encryptCon(vieja, 'Ana'),
            perfil: { limitaciones: [encryptCon(vieja, 'rodilla'), encryptCon(vieja, 'lumbar')], aclaracion: encryptCon(vieja, 'Trabajo de pie') },
        });

        const simulacion = await recifrarUsuarios({ claveAnterior: VIEJA, claveNueva: NUEVA, simular: true });
        expect(simulacion.migrados).toBe(1);
        expect(decryptCon(vieja, (await users.findOne()).nombre)).toBe('Ana'); // simular no escribe

        const resultado = await recifrarUsuarios({ claveAnterior: VIEJA, claveNueva: NUEVA });
        expect(resultado).toMatchObject({ usuarios: 1, migrados: 1, ilegibles: [] });

        const nueva = derivarClave(NUEVA);
        const user = await users.findOne();
        expect(decryptCon(nueva, user.nombre)).toBe('Ana');
        expect(user.perfil.limitaciones.map(l => decryptCon(nueva, l))).toEqual(['rodilla', 'lumbar']);
        expect(decryptCon(nueva, user.perfil.aclaracion)).toBe('Trabajo de pie');

        const otraVez = await recifrarUsuarios({ claveAnterior: VIEJA, claveNueva: NUEVA });
        expect(otraVez).toMatchObject({ migrados: 0, yaEstaban: 1 });
    });

    test('lo que no abre con ninguna clave se informa y no se toca', () => {
        const otra = derivarClave('una-tercera-clave');
        const valor = encryptCon(otra, 'Pedro');
        const r = recifrarValor(valor, derivarClave(VIEJA), derivarClave(NUEVA));
        expect(r.estado).toBe('ilegible');
        expect(r.valor).toBe(valor);
    });

    test('con la clave equivocada nunca da por buena basura (1000 intentos)', () => {
        const vieja = derivarClave(VIEJA);
        const nueva = derivarClave(NUEVA);
        for (let i = 0; i < 1000; i++) {
            const r = recifrarValor(encryptCon(vieja, `Nombre ${i}`), vieja, nueva);
            expect(r.estado).toBe('migrado');
            expect(decryptCon(nueva, r.valor)).toBe(`Nombre ${i}`);
        }
    });

    test('misma clave o clave faltante es un error', async () => {
        await expect(recifrarUsuarios({ claveAnterior: VIEJA, claveNueva: VIEJA })).rejects.toThrow('iguales');
        await expect(recifrarUsuarios({ claveAnterior: VIEJA })).rejects.toThrow('Faltan');
    });
});
