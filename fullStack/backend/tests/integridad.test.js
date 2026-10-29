const request = require('supertest');
const app = require('../app');
const db = require('./helpers/db');
const User = require('../models/User');
const Plan = require('../models/Plan');
const Checkin = require('../models/Checkin');
const DigitoVerificadorVertical = require('../models/DigitoVerificadorVertical');
const { asegurarPermisosBase } = require('../services/permisosService');
const { dvhDe, camposDVH } = require('../utils/digitosVerificadores');

beforeAll(db.conectar);
afterEach(db.limpiar);
afterAll(db.desconectar);

// Los hooks post-save del DVV son async: se espera a que la cola termine
const esperarDVV = () => new Promise(r => setTimeout(r, 100));

async function adminConToken() {
    const res = await request(app).post('/auth/register').send({ nombre: 'Admin', email: 'admin@test.com', password: 'clave1234' });
    const { Administrador } = await asegurarPermisosBase();
    await User.updateOne({ email: 'admin@test.com' }, { familias: [Administrador._id], rol: 'admin' });
    return res.body.token;
}

describe('camposDVH', () => {
    test('usa el nombre descifrado: el mismo dato da siempre el mismo DVH', async () => {
        const { encrypt } = require('../utils/crypto');
        const a = { email: 'a@b.com', nombre: encrypt('Ana'), rol: 'usuario', perfil: { peso: 60 } };
        const b = { ...a, nombre: encrypt('Ana') }; // otro IV, mismo texto
        expect(a.nombre).not.toBe(b.nombre);
        expect(dvhDe('users', a)).toBe(dvhDe('users', b));
    });

    test('una colección desconocida tira error', () => {
        expect(() => camposDVH('otra', {})).toThrow();
    });
});

describe('DVH y DVV al escribir', () => {
    test('save, findOneAndUpdate y updateMany dejan el DVH y el DVV al día', async () => {
        await request(app).post('/auth/register').send({ nombre: 'Ana', email: 'ana@test.com', password: 'clave1234' });
        const user = await User.findOne({ email: 'ana@test.com' }).lean();
        expect(user.dvh).toBe(dvhDe('users', user));

        const plan = await Plan.create({ userId: user._id, meta: { caloriasObjetivoDia: 2000 } });
        await Plan.updateMany({ userId: user._id, estado: 'activo' }, { $set: { estado: 'archivado' } });
        const archivado = await Plan.findById(plan._id).lean();
        expect(archivado.estado).toBe('archivado');
        expect(archivado.dvh).toBe(dvhDe('plans', archivado));

        await Checkin.findOneAndUpdate(
            { userId: user._id, fecha: '2026-10-28' },
            { userId: user._id, fecha: '2026-10-28', rutina: { estado: 'completado', puntaje: 1 }, dieta: { estado: 'parcial', puntaje: 0.5 }, puntajeTotal: 1.5 },
            { upsert: true, returnDocument: 'after' }
        );
        const checkin = await Checkin.findOne({ userId: user._id }).lean();
        expect(checkin.dvh).toBe(dvhDe('checkins', checkin));

        await esperarDVV();
        const dvvPlanes = await DigitoVerificadorVertical.findOne({ coleccion: 'plans' }).lean();
        expect(dvvPlanes.dvv).toBe(archivado.dvh % 100000);
    });
});

describe('/integridad', () => {
    test('detecta un peso editado a mano y Recalcular lo deja OK', async () => {
        const token = await adminConToken();
        await request(app).post('/auth/register').send({ nombre: 'Beto', email: 'beto@test.com', password: 'clave1234' });
        await User.updateOne({ email: 'beto@test.com' }, { $set: { 'perfil.peso': 80 } });
        await esperarDVV();

        let res = await request(app).get('/integridad/verificar').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(true);

        // Edición "por fuera de la app": el driver nativo no pasa por los hooks
        await User.collection.updateOne({ email: 'beto@test.com' }, { $set: { 'perfil.peso': 95 } });

        res = await request(app).get('/integridad/verificar').set('Authorization', `Bearer ${token}`);
        const usuarios = res.body.colecciones.find(c => c.coleccion === 'users');
        expect(res.body.ok).toBe(false);
        expect(usuarios.filasAlteradas.map(f => f.referencia)).toEqual(['beto@test.com']);
        expect(usuarios.dvvCalculado).not.toBe(usuarios.dvvGuardado);

        res = await request(app).post('/integridad/recalcular').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        await esperarDVV();

        res = await request(app).get('/integridad/verificar').set('Authorization', `Bearer ${token}`);
        expect(res.body.ok).toBe(true);
    });

    test('una fila borrada por fuera de la app cambia el DVV', async () => {
        const token = await adminConToken();
        await request(app).post('/auth/register').send({ nombre: 'Caro', email: 'caro@test.com', password: 'clave1234' });
        await esperarDVV();
        await User.collection.deleteOne({ email: 'caro@test.com' });

        const res = await request(app).get('/integridad/verificar').set('Authorization', `Bearer ${token}`);
        const usuarios = res.body.colecciones.find(c => c.coleccion === 'users');
        expect(usuarios.filasAlteradas).toEqual([]);
        expect(usuarios.ok).toBe(false);
    });

    test('un usuario común no puede verificar ni recalcular', async () => {
        const res = await request(app).post('/auth/register').send({ nombre: 'Dani', email: 'dani@test.com', password: 'clave1234' });
        const token = res.body.token;
        expect((await request(app).get('/integridad/verificar').set('Authorization', `Bearer ${token}`)).status).toBe(403);
        expect((await request(app).post('/integridad/recalcular').set('Authorization', `Bearer ${token}`)).status).toBe(403);
    });
});
