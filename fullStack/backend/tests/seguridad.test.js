// Pruebas de seguridad: autenticación, autorización, inyección y validaciones
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../app');
const db = require('./helpers/db');
const User = require('../models/User');

beforeAll(db.conectar);
afterEach(db.limpiar);
afterAll(db.desconectar);

async function registrar(email = 'seg@test.com', password = 'clave1234') {
    const res = await request(app).post('/auth/register').send({ nombre: 'Seg', email, password });
    return { auth: { Authorization: `Bearer ${res.body.token}` }, id: res.body.user?._id };
}

const RUTAS_PRIVADAS = [
    ['get', '/users/perfil'], ['get', '/users/permisos'], ['get', '/plan/actual'], ['get', '/checkins/semana'],
    ['post', '/checkins'], ['get', '/users/todos'], ['get', '/bitacora'], ['get', '/integridad/verificar'], ['post', '/backup'],
];

describe('Autenticación', () => {
    test.each(RUTAS_PRIVADAS)('%s %s sin token responde 401', async (metodo, ruta) => {
        expect((await request(app)[metodo](ruta)).status).toBe(401);
    });

    test('token mal formado, firmado con otra clave o vencido → 401', async () => {
        const { id } = await registrar();
        const otraClave = jwt.sign({ userId: id }, 'otra-clave');
        const vencido = jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: -10 });
        for (const token of ['basura', 'Bearer', otraClave, vencido]) {
            const res = await request(app).get('/users/perfil').set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(401);
        }
        // sin el prefijo "Bearer "
        const valido = jwt.sign({ userId: id }, process.env.JWT_SECRET);
        expect((await request(app).get('/users/perfil').set('Authorization', valido)).status).toBe(401);
    });

    test('el token de una cuenta borrada deja de servir', async () => {
        const { auth, id } = await registrar();
        await User.deleteOne({ _id: id });
        expect((await request(app).get('/users/perfil').set(auth)).status).toBe(401);
    });

    test('un token anterior al cambio de contraseña deja de servir', async () => {
        const { auth, id } = await registrar();
        await User.updateOne({ _id: id }, { passwordCambiadaEn: new Date(Date.now() + 5000) });
        expect((await request(app).get('/users/perfil').set(auth)).status).toBe(401);
    });

    test('el rol del token no sirve para escalar: manda lo que dice la base', async () => {
        const { id } = await registrar();
        const falso = jwt.sign({ userId: id, rol: 'admin' }, process.env.JWT_SECRET);
        expect((await request(app).get('/users/todos').set('Authorization', `Bearer ${falso}`)).status).toBe(403);
    });
});

describe('Inyección NoSQL', () => {
    test('login con operadores de Mongo en email o password → 400, nunca 200 ni 500', async () => {
        await registrar('victima@test.com');
        const intentos = [
            { email: { $ne: null }, password: 'clave1234' },
            { email: 'victima@test.com', password: { $ne: null } },
            { email: { $gt: '' }, password: { $gt: '' } },
            { email: 'victima@test.com', password: ['clave1234'] },
        ];
        for (const body of intentos) {
            const res = await request(app).post('/auth/login').send(body);
            expect(res.status).toBe(400);
            expect(res.body.token).toBeUndefined();
        }
    });

    test('forgot-password y reset-password no aceptan objetos', async () => {
        await registrar('victima@test.com');
        expect((await request(app).post('/auth/forgot-password').send({ email: { $ne: null } })).status).toBe(400);
        const res = await request(app).post('/auth/reset-password').send({ token: { $ne: null }, password: 'nuevaClave99' });
        expect(res.status).toBe(400);
    });

    test('el filtro de la bitácora escapa la expresión regular del email', async () => {
        // ".*" literal no tiene que matchear todas las cuentas
        const { auth, id } = await registrar('admin@test.com');
        const { asegurarPermisosBase } = require('../services/permisosService');
        const { Administrador } = await asegurarPermisosBase();
        await User.updateOne({ _id: id }, { familias: [Administrador._id] });
        const res = await request(app).get('/bitacora?email=.*').set(auth);
        expect(res.body.total).toBe(0);
    });
});

describe('Validaciones', () => {
    test.each([
        [{ nombre: 'A', email: 'no-es-email', password: 'clave1234' }, 'email inválido'],
        [{ nombre: 'A', email: 'a@b.com', password: 'corta' }, 'contraseña de menos de 8'],
        [{ nombre: '', email: 'a@b.com', password: 'clave1234' }, 'sin nombre'],
        [{ nombre: 'A', email: 'a@b.com', password: 12345678 }, 'contraseña que no es texto'],
        [{}, 'cuerpo vacío'],
    ])('registro rechaza %o (%s) con 400', async (body) => {
        expect((await request(app).post('/auth/register').send(body)).status).toBe(400);
    });

    test('no se puede registrar dos veces el mismo email (ni cambiando mayúsculas)', async () => {
        await registrar('dup@test.com');
        const res = await request(app).post('/auth/register').send({ nombre: 'B', email: ' DUP@test.com ', password: 'clave1234' });
        expect(res.status).toBe(400);
    });

    test('checkin con valores inválidos → 400', async () => {
        const { auth } = await registrar();
        for (const body of [{ rutina: 'mucho', dieta: 'parcial' }, { rutina: 'completado' }, { rutina: { $ne: null }, dieta: 'parcial' }, {}]) {
            expect((await request(app).post('/checkins').set(auth).send(body)).status).toBe(400);
        }
    });

    test('JSON mal formado → 400 con JSON, sin stack trace', async () => {
        const res = await request(app).post('/auth/login').set('Content-Type', 'application/json').send('{"email": ');
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('JSON inválido');
        expect(res.text).not.toMatch(/at .*\.js/);
    });

    test('login sin cuerpo → 400 (antes era 500)', async () => {
        expect((await request(app).post('/auth/login')).status).toBe(400);
        expect((await request(app).post('/auth/register')).status).toBe(400);
    });

    test('el perfil no expone hashes ni datos de recuperación', async () => {
        const { auth } = await registrar();
        await request(app).post('/auth/forgot-password').send({ email: 'seg@test.com' });
        const res = await request(app).get('/users/perfil').set(auth);
        expect(res.status).toBe(200);
        expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|resetTokenHash|resetTokenExpira|dvh/);
        expect(res.body.nombre).toBe('Seg'); // y el nombre llega descifrado
    });
});
