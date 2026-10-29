// Pruebas de integración: flujos completos contra Mongo en memoria, con la IA y el mail simulados
jest.mock('../services/mailService', () => ({
    ...jest.requireActual('../services/mailService'),
    enviarMailDeReset: jest.fn().mockResolvedValue({ enviado: false }),
}));

const request = require('supertest');
const app = require('../app');
const db = require('./helpers/db');
const IAFalsa = require('./helpers/iaFalsa');
const User = require('../models/User');
const { enviarMailDeReset } = require('../services/mailService');
const { usarEstrategiaIA } = require('../services/ia/iaFactory');
const { asegurarPermisosBase } = require('../services/permisosService');
const { decrypt } = require('../utils/crypto');

beforeAll(db.conectar);
afterEach(async () => {
    await db.limpiar();
    enviarMailDeReset.mockClear();
});
afterAll(db.desconectar);

const ONBOARDING = {
    peso: 68, altura: 170, edad: 27, sexo: 'femenino', objetivo: 'perder grasa', nivel: 'principiante',
    diasDispo: ['lunes', 'miercoles', 'viernes'], minutosPorSesion: 40, tipoDieta: 'vegetariana',
    presupuesto: 25000, limitaciones: ['rodilla'], aclaracion: 'Trabajo de pie todo el día',
};

async function registrar(email, password = 'clave1234') {
    const res = await request(app).post('/auth/register').send({ nombre: 'Flor', email, password });
    return { auth: { Authorization: `Bearer ${res.body.token}` }, token: res.body.token, id: res.body.user._id };
}

describe('Registro → onboarding → plan → checkin → adherencia', () => {
    test('el flujo completo de un usuario nuevo', async () => {
        const ia = new IAFalsa({ dias: ['lunes', 'miercoles', 'viernes', 'domingo'] }); // la IA agrega un día que no se eligió
        usarEstrategiaIA(ia);

        const { auth, id } = await registrar('flor@test.com');

        const ob = await request(app).post('/users/onboarding').set(auth).send(ONBOARDING);
        expect(ob.status).toBe(200);

        // los datos de salud quedan cifrados en la base
        const guardado = await User.findById(id).lean();
        expect(guardado.perfil.limitaciones[0]).not.toBe('rodilla');
        expect(decrypt(guardado.perfil.limitaciones[0])).toBe('rodilla');
        expect(decrypt(guardado.perfil.aclaracion)).toBe('Trabajo de pie todo el día');

        const gen = await request(app).post('/plan/generar').set(auth).send({ idioma: 'es' });
        expect(gen.status).toBe(200);

        // a la IA le llegaron la dieta vegetariana y las reglas de rodilla en texto plano
        expect(ia.prompts.some(p => p.includes('vegetariana'))).toBe(true);
        expect(ia.prompts.some(p => /rodilla: sin saltos/.test(p))).toBe(true);

        const plan = (await request(app).get('/plan/actual').set(auth)).body;
        // solo los días elegidos, aunque la IA haya agregado el domingo
        expect(plan.rutina.map(r => r.dia)).toEqual(['lunes', 'miercoles', 'viernes']);
        // la sentadilla con salto se reemplazó por su alternativa permitida
        const nombres = plan.rutina.flatMap(r => r.ejercicios.map(e => e.nombre));
        expect(nombres).not.toEqual(expect.arrayContaining(['Sentadilla con salto']));
        expect(nombres).toContain('Sentadilla a la caja');
        expect(plan.dieta).toHaveLength(7);
        expect(plan.meta.nivelDificultad).toBe('principiante'); // la IA había mandado "Intermediate"

        const checkin = await request(app).post('/checkins').set(auth).send({ rutina: 'completado', dieta: 'parcial' });
        expect(checkin.status).toBe(200);
        expect(checkin.body.checkin.puntajeTotal).toBe(1.5);

        const hoy = await request(app).get('/checkins/hoy').set(auth);
        expect(hoy.body.checkin.puntajeTotal).toBe(1.5);

        const semana = await request(app).get('/checkins/semana').set(auth);
        expect(semana.body.semana).toHaveLength(7);
        expect(semana.body.diasContados).toBe(1); // el plan es de hoy: los días anteriores no cuentan
        expect(semana.body.racha).toBe(1);
        expect(semana.body.porcentaje).toBeGreaterThan(0);
    });

    test('generar el plan sin onboarding da 400', async () => {
        usarEstrategiaIA(new IAFalsa());
        const { auth } = await registrar('apurado@test.com');
        expect((await request(app).post('/plan/generar').set(auth).send({})).status).toBe(400);
    });

    test('si la IA falla responde 503 y no queda un plan a medias', async () => {
        usarEstrategiaIA({ completar: async () => { throw new Error('Groq caído'); } });
        const { auth } = await registrar('sinia@test.com');
        await request(app).post('/users/onboarding').set(auth).send(ONBOARDING);
        const errorOriginal = console.error;
        console.error = jest.fn();
        const res = await request(app).post('/plan/generar').set(auth).send({});
        console.error = errorOriginal;
        expect(res.status).toBe(503);
        expect((await request(app).get('/plan/actual').set(auth)).status).toBe(404);
    });

    test('un segundo plan archiva el anterior', async () => {
        usarEstrategiaIA(new IAFalsa());
        const { auth } = await registrar('dos@test.com');
        await request(app).post('/users/onboarding').set(auth).send(ONBOARDING);
        const primero = (await request(app).post('/plan/generar').set(auth).send({})).body.plan;
        const segundo = (await request(app).post('/plan/generar').set(auth).send({})).body.plan;
        const actual = (await request(app).get('/plan/actual').set(auth)).body;
        expect(actual._id).toBe(segundo._id);
        expect(actual._id).not.toBe(primero._id);
    });
});

describe('Recuperación de contraseña', () => {
    const pedirEnlace = async (email) => {
        await request(app).post('/auth/forgot-password').send({ email });
        return enviarMailDeReset.mock.calls.at(-1)?.[0]?.token;
    };

    test('el enlace sirve una sola vez y cierra las sesiones anteriores', async () => {
        const { auth } = await registrar('olvido@test.com');
        const token = await pedirEnlace('olvido@test.com');
        expect(token).toMatch(/^[0-9a-f]{64}$/);

        // en la base solo queda el hash del token
        const user = await User.findOne({ email: 'olvido@test.com' }).lean();
        expect(user.resetTokenHash).not.toBe(token);

        // el JWT nuevo tiene que ser de un segundo posterior al cambio (iat va en segundos)
        await new Promise(r => setTimeout(r, 1100));

        const reset = await request(app).post('/auth/reset-password').send({ token, password: 'nuevaClave99' });
        expect(reset.status).toBe(200);
        expect(reset.body.token).toBeTruthy();

        // segundo uso del mismo enlace
        const otraVez = await request(app).post('/auth/reset-password').send({ token, password: 'otraClave99' });
        expect(otraVez.status).toBe(400);
        expect(otraVez.body.codigo).toBe('ENLACE_INVALIDO');

        // la sesión de antes del cambio ya no vale; la nueva sí
        expect((await request(app).get('/users/perfil').set(auth)).status).toBe(401);
        expect((await request(app).get('/users/perfil').set('Authorization', `Bearer ${reset.body.token}`)).status).toBe(200);

        expect((await request(app).post('/auth/login').send({ email: 'olvido@test.com', password: 'clave1234' })).status).toBe(400);
        expect((await request(app).post('/auth/login').send({ email: 'olvido@test.com', password: 'nuevaClave99' })).status).toBe(200);
    });

    test('un enlace vencido no sirve', async () => {
        await registrar('vencido@test.com');
        const token = await pedirEnlace('vencido@test.com');
        await User.updateOne({ email: 'vencido@test.com' }, { resetTokenExpira: new Date(Date.now() - 1000) });
        const res = await request(app).post('/auth/reset-password').send({ token, password: 'nuevaClave99' });
        expect(res.status).toBe(400);
    });

    test('responde lo mismo exista o no la cuenta, y no manda dos mails seguidos', async () => {
        await registrar('existe@test.com');
        const a = await request(app).post('/auth/forgot-password').send({ email: 'existe@test.com' });
        const b = await request(app).post('/auth/forgot-password').send({ email: 'noexiste@test.com' });
        expect(a.status).toBe(200);
        expect(a.body).toEqual(b.body);
        await request(app).post('/auth/forgot-password').send({ email: 'existe@test.com' });
        expect(enviarMailDeReset).toHaveBeenCalledTimes(1);
    });
});

describe('Administración de usuarios', () => {
    async function admin() {
        const r = await registrar('admin@test.com');
        const { Administrador } = await asegurarPermisosBase();
        await User.updateOne({ _id: r.id }, { familias: [Administrador._id], rol: 'admin' });
        return r;
    }

    test('lista sin datos sensibles y borra a un usuario con sus datos', async () => {
        const { auth } = await admin();
        const otro = await registrar('otro@test.com');

        const lista = await request(app).get('/users/todos').set(auth);
        expect(lista.status).toBe(200);
        expect(lista.body.users).toHaveLength(2);
        const texto = JSON.stringify(lista.body);
        expect(texto).not.toMatch(/passwordHash|resetToken|peso/);
        expect(lista.body.users.find(u => u.email === 'otro@test.com').nombre).toBe('Flor');

        expect((await request(app).delete(`/users/${otro.id}`).set(auth)).status).toBe(200);
        expect((await request(app).get('/users/perfil').set(otro.auth)).status).toBe(401);
    });

    test('no puede borrar a otro admin ni usar un id inválido', async () => {
        const { auth } = await admin();
        const otroAdmin = await registrar('admin2@test.com');
        await User.updateOne({ _id: otroAdmin.id }, { rol: 'admin' });
        expect((await request(app).delete(`/users/${otroAdmin.id}`).set(auth)).status).toBe(403);
        expect((await request(app).delete('/users/no-es-un-id').set(auth)).status).toBe(400);
        expect((await request(app).delete('/users/6ae2a5b7e70347ff5e60bf7b').set(auth)).status).toBe(404);
    });
});
