const request = require('supertest');
const app = require('../app');
const db = require('./helpers/db');
const User = require('../models/User');
const { emailsAdmin, aplicarAdminsConfigurados } = require('../services/adminsService');
const { verificarColeccion } = require('../services/integridadService');

beforeAll(db.conectar);
afterEach(async () => {
    delete process.env.ADMIN_EMAILS;
    await db.limpiar();
});
afterAll(db.desconectar);

const registrar = (email) =>
    request(app).post('/auth/register').send({ nombre: 'Test', email, password: 'clave1234' });

const patentesDe = async (token) =>
    (await request(app).get('/users/permisos').set('Authorization', `Bearer ${token}`)).body.patentes;

describe('ADMIN_EMAILS', () => {
    test('separa por coma, ignora espacios y mayúsculas y no repite', () => {
        expect(emailsAdmin({ ADMIN_EMAILS: ' Ana@Test.com, ,bruno@test.com,ana@test.com ' }))
            .toEqual(['ana@test.com', 'bruno@test.com']);
        expect(emailsAdmin({})).toEqual([]);
    });

    test('una cuenta de la lista nace como admin al registrarse', async () => {
        process.env.ADMIN_EMAILS = 'jefa@test.com';
        const res = await registrar('Jefa@Test.com');
        expect(res.status).toBe(201);

        const user = await User.findOne({ email: 'jefa@test.com' });
        expect(user.rol).toBe('admin');
        expect(await patentesDe(res.body.token)).toEqual(expect.arrayContaining(['usuarios.listar', 'plan.ver']));
    });

    test('una cuenta que no está en la lista nace como usuario', async () => {
        process.env.ADMIN_EMAILS = 'jefa@test.com';
        const res = await registrar('otro@test.com');
        expect((await User.findOne({ email: 'otro@test.com' })).rol).toBe('usuario');
        expect(await patentesDe(res.body.token)).not.toContain('usuarios.listar');
    });

    test('al arrancar promueve las cuentas existentes y avisa las que faltan', async () => {
        const { body } = await registrar('existente@test.com');
        expect(await patentesDe(body.token)).not.toContain('usuarios.listar');

        const r = await aplicarAdminsConfigurados({ ADMIN_EMAILS: 'existente@test.com,nueva@test.com' });
        expect(r).toEqual({ promovidos: ['existente@test.com'], yaEran: [], sinCuenta: ['nueva@test.com'] });
        // el rol se lee de la base en cada pedido: el mismo token ya tiene los permisos de admin
        expect(await patentesDe(body.token)).toContain('usuarios.listar');

        const otraVez = await aplicarAdminsConfigurados({ ADMIN_EMAILS: 'existente@test.com' });
        expect(otraVez).toEqual({ promovidos: [], yaEran: ['existente@test.com'], sinCuenta: [] });
    });

    test('promover deja los dígitos verificadores al día', async () => {
        await registrar('dvh@test.com');
        await aplicarAdminsConfigurados({ ADMIN_EMAILS: 'dvh@test.com' });
        const r = await verificarColeccion('users');
        expect(r.filasAlteradas).toEqual([]);
        expect(r.ok).toBe(true);
    });
});
