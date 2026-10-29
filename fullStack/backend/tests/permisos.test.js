const request = require('supertest');
const app = require('../app');
const db = require('./helpers/db');
const User = require('../models/User');
const Familia = require('../models/Familia');
const { FamiliaCompuesta, PatenteHoja, asegurarPermisosBase } = require('../services/permisosService');

beforeAll(db.conectar);
afterEach(db.limpiar);
afterAll(db.desconectar);

async function registrar(email) {
    const res = await request(app).post('/auth/register').send({ nombre: 'Test', email, password: 'clave1234' });
    return res.body.token;
}

async function hacerAdmin(email) {
    const { Administrador } = await asegurarPermisosBase();
    await User.updateOne({ email }, { familias: [Administrador._id], rol: 'admin' });
}

describe('Composite de permisos', () => {
    test('una familia junta las patentes de sus hijos', () => {
        const usuario = new FamiliaCompuesta('Usuario', 'u').agregar(new PatenteHoja('plan.ver'));
        const admin = new FamiliaCompuesta('Admin', 'a').agregar(usuario).agregar(new PatenteHoja('usuarios.borrar'));
        expect([...admin.obtenerPatentes()].sort()).toEqual(['plan.ver', 'usuarios.borrar']);
    });

    test('un ciclo entre familias no entra en loop', () => {
        const a = new FamiliaCompuesta('A', 'a').agregar(new PatenteHoja('x'));
        const b = new FamiliaCompuesta('B', 'b').agregar(new PatenteHoja('y'));
        a.agregar(b);
        b.agregar(a);
        expect([...a.obtenerPatentes()].sort()).toEqual(['x', 'y']);
    });
});

describe('Patentes en las rutas', () => {
    test('el registro asigna la familia Usuario y sus patentes', async () => {
        const token = await registrar('nuevo@test.com');
        const res = await request(app).get('/users/permisos').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.patentes).toEqual(expect.arrayContaining(['plan.ver', 'checkin.registrar']));
        expect(res.body.patentes).not.toContain('usuarios.listar');
    });

    test('un usuario común recibe 403 en /users/todos', async () => {
        const token = await registrar('comun@test.com');
        const res = await request(app).get('/users/todos').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(403);
    });

    test('un admin entra a /users/todos', async () => {
        const token = await registrar('admin@test.com');
        await hacerAdmin('admin@test.com');
        const res = await request(app).get('/users/todos').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
    });

    test('sin familias no tiene acceso ni a su plan', async () => {
        const token = await registrar('vacio@test.com');
        await User.updateOne({ email: 'vacio@test.com' }, { familias: [] });
        const res = await request(app).get('/plan/actual').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(403);
    });
});

describe('Gestión de familias', () => {
    test('quitarle Administrador a alguien le saca el acceso al instante', async () => {
        const tokenAdmin = await registrar('jefe@test.com');
        await hacerAdmin('jefe@test.com');
        const tokenOtro = await registrar('otro@test.com');
        await hacerAdmin('otro@test.com');
        const otro = await User.findOne({ email: 'otro@test.com' });

        expect((await request(app).get('/users/todos').set('Authorization', `Bearer ${tokenOtro}`)).status).toBe(200);

        const usuario = await Familia.findOne({ nombre: 'Usuario' });
        const res = await request(app)
            .put(`/permisos/usuarios/${otro._id}`)
            .set('Authorization', `Bearer ${tokenAdmin}`)
            .send({ familias: [usuario._id], patentes: [] });
        expect(res.status).toBe(200);
        expect(res.body.usuario.rol).toBe('usuario');

        expect((await request(app).get('/users/todos').set('Authorization', `Bearer ${tokenOtro}`)).status).toBe(403);
    });

    test('no se puede editar una familia para que se contenga a sí misma', async () => {
        const token = await registrar('jefe2@test.com');
        await hacerAdmin('jefe2@test.com');
        const usuario = await Familia.findOne({ nombre: 'Usuario' });
        const admin = await Familia.findOne({ nombre: 'Administrador' });

        // Administrador ya contiene a Usuario: meter Administrador dentro de Usuario forma un ciclo
        const res = await request(app)
            .put(`/permisos/familias/${usuario._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ nombre: 'Usuario', patentes: usuario.patentes, familias: [admin._id] });
        expect(res.status).toBe(400);
    });

    test('un admin no puede cambiar sus propios permisos', async () => {
        const token = await registrar('jefe3@test.com');
        await hacerAdmin('jefe3@test.com');
        const yo = await User.findOne({ email: 'jefe3@test.com' });
        const res = await request(app)
            .put(`/permisos/usuarios/${yo._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ familias: [], patentes: [] });
        expect(res.status).toBe(400);
    });
});
