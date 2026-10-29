const request = require('supertest');
const app = require('../app');
const db = require('./helpers/db');
const User = require('../models/User');
const Plan = require('../models/Plan');
const Checkin = require('../models/Checkin');
const { asegurarPermisosBase } = require('../services/permisosService');

beforeAll(db.conectar);
afterEach(db.limpiar);
afterAll(db.desconectar);

async function registrar(email) {
    const res = await request(app).post('/auth/register').send({ nombre: 'Test', email, password: 'clave1234' });
    return { auth: { Authorization: `Bearer ${res.body.token}` }, id: res.body.user._id };
}

describe('DELETE /users/borrar (borrar la propia cuenta)', () => {
    test('borra la cuenta con sus planes y checkins, y el token deja de servir', async () => {
        const { auth, id } = await registrar('chau@test.com');
        await Plan.create({ userId: id });
        await Checkin.create({ userId: id, fecha: '2026-10-29' });

        const res = await request(app).delete('/users/borrar').set(auth);
        expect(res.status).toBe(200);
        expect(await User.exists({ _id: id })).toBeNull();
        expect(await Plan.countDocuments({ userId: id })).toBe(0);
        expect(await Checkin.countDocuments({ userId: id })).toBe(0);

        expect((await request(app).get('/users/perfil').set(auth)).status).toBe(401);
    });

    test('un admin no puede borrar su propia cuenta', async () => {
        const { auth, id } = await registrar('jefe@test.com');
        const { Administrador } = await asegurarPermisosBase();
        await User.updateOne({ _id: id }, { familias: [Administrador._id], rol: 'admin' });

        const res = await request(app).delete('/users/borrar').set(auth);
        expect(res.status).toBe(403);
        expect(await User.exists({ _id: id })).not.toBeNull();
    });

    test('sin la patente cuenta.borrar recibe 403', async () => {
        const { auth, id } = await registrar('sinpatente@test.com');
        await User.updateOne({ _id: id }, { familias: [] });
        expect((await request(app).delete('/users/borrar').set(auth)).status).toBe(403);
    });
});
