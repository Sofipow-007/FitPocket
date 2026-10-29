const request = require('supertest');
const app = require('../app');
const db = require('./helpers/db');
const IAFalsa = require('./helpers/iaFalsa');
const Bitacora = require('../models/Bitacora');
const Checkin = require('../models/Checkin');
const Plan = require('../models/Plan');
const { crearEstrategiaIA, usarEstrategiaIA } = require('../services/ia/iaFactory');
const GroqStrategy = require('../services/ia/GroqStrategy');
const OllamaStrategy = require('../services/ia/OllamaStrategy');
const { crearMail } = require('../services/mailService');
const { calcularAdherencia, AdherenciaSemanal, AdherenciaMensual, estrategiaAdherencia } = require('../services/adherenciaService');
const { BusDeEventos } = require('../services/eventos');
const { revisarAdherencia, debeAlertar, ACCION_ALERTA } = require('../services/suscriptores/alertasAdherencia');

const esperar = (ms) => new Promise(r => setTimeout(r, ms));

describe('Factory Method + Strategy de IA', () => {
    const original = process.env.IA_PROVIDER;
    afterEach(() => { process.env.IA_PROVIDER = original; });

    test('crea la estrategia según IA_PROVIDER', () => {
        process.env.IA_PROVIDER = 'groq';
        expect(crearEstrategiaIA()).toBeInstanceOf(GroqStrategy);
        process.env.IA_PROVIDER = 'Ollama ';
        expect(crearEstrategiaIA()).toBeInstanceOf(OllamaStrategy);
    });

    test('un proveedor inválido da un error entendible', () => {
        expect(() => crearEstrategiaIA('gpt')).toThrow('IA_PROVIDER="gpt" no es válido. Usá uno de: groq, ollama.');
    });

    test('Groq sin API key falla al usarse, no al crearse', async () => {
        const groq = new GroqStrategy({ apiKey: '' });
        await expect(groq.completar([{ role: 'user', content: 'hola' }], 0.5)).rejects.toThrow('Falta GROQ_API_KEY');
    });

    test('Ollama habla con /api/chat y devuelve el texto', async () => {
        const fetchOriginal = global.fetch;
        global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ message: { content: '{"ok":true}' } }) });
        try {
            const ollama = new OllamaStrategy({ url: 'http://ollama:11434/', modelo: 'llama3.1' });
            const texto = await ollama.completar([{ role: 'user', content: 'hola' }], 0.2);
            expect(texto).toBe('{"ok":true}');
            const [url, opciones] = global.fetch.mock.calls[0];
            expect(url).toBe('http://ollama:11434/api/chat');
            expect(JSON.parse(opciones.body)).toMatchObject({ model: 'llama3.1', stream: false, options: { temperature: 0.2 } });
        } finally {
            global.fetch = fetchOriginal;
        }
    });

    test('Ollama caído da un error que dice dónde lo buscó', async () => {
        const fetchOriginal = global.fetch;
        global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));
        try {
            const ollama = new OllamaStrategy({ url: 'http://localhost:11434' });
            await expect(ollama.completar([], 0.5)).rejects.toThrow('No se pudo conectar con Ollama en http://localhost:11434');
        } finally {
            global.fetch = fetchOriginal;
        }
    });
});

describe('Factory Method de mails', () => {
    test('arma el mail de recuperación en el idioma pedido', () => {
        const es = crearMail('recuperacion', 'es', { token: 'abc', minutos: 30 });
        const en = crearMail('recuperacion', 'en', { token: 'abc', minutos: 30 });
        expect(es.asunto).toMatch(/Restablecé/);
        expect(en.asunto).toMatch(/Reset/);
        expect(es.enlace).toMatch(/\/restablecer\?token=abc$/);
        expect(es.texto).toMatch(/30 minutos/);
    });

    test('un idioma desconocido cae en español y un tipo desconocido tira error', () => {
        expect(crearMail('alertaAdherencia', 'fr', { porcentaje: 40 }).texto).toMatch(/40%/);
        expect(() => crearMail('otro', 'es')).toThrow();
    });
});

describe('Strategy de adherencia', () => {
    test('la semanal mira 7 días y la mensual 30, terminando hoy', () => {
        const hoy = new Date('2026-10-28T15:00:00Z');
        const semana = new AdherenciaSemanal().fechas(hoy);
        expect(semana).toHaveLength(7);
        expect(semana[6]).toBe('2026-10-28');
        expect(new AdherenciaMensual().fechas(hoy)).toHaveLength(30);
        expect(() => estrategiaAdherencia('anual')).toThrow();
    });

    test('la rutina solo cuenta en días de entreno y la dieta todos los días', () => {
        // 2026-10-26 es lunes, 2026-10-27 martes
        const fechas = ['2026-10-26', '2026-10-27'];
        const porFecha = {
            '2026-10-26': { rutina: { puntaje: 1 }, dieta: { puntaje: 1 }, puntajeTotal: 2 },
            '2026-10-27': { rutina: { puntaje: 0 }, dieta: { puntaje: 0.5 }, puntajeTotal: 0.5 },
        };
        const r = calcularAdherencia({ fechas, diasEntreno: new Set(['lunes']), desde: null, porFecha });
        // máximo = 1 día de entreno + 2 días de dieta = 3; puntos = 1 + 1 + 0.5 = 2.5
        expect(r.porcentaje).toBe(83);
        expect(r.racha).toBe(2);
    });

    test('los días antes del primer plan no cuentan', () => {
        const r = calcularAdherencia({
            fechas: ['2026-10-26', '2026-10-27'],
            diasEntreno: new Set(),
            desde: '2026-10-27',
            porFecha: { '2026-10-27': { dieta: { puntaje: 1 }, puntajeTotal: 1 } },
        });
        expect(r.diasContados).toBe(1);
        expect(r.porcentaje).toBe(100);
    });

    test('la racha se corta en el primer día sin puntos', () => {
        const r = calcularAdherencia({
            fechas: ['2026-10-25', '2026-10-26', '2026-10-27'],
            diasEntreno: new Set(),
            desde: null,
            porFecha: {
                '2026-10-25': { dieta: { puntaje: 1 }, puntajeTotal: 1 },
                '2026-10-27': { dieta: { puntaje: 1 }, puntajeTotal: 1 },
            },
        });
        expect(r.racha).toBe(1);
    });

    test('la alerta pide al menos 3 días contados y menos de 50%', () => {
        expect(debeAlertar({ porcentaje: 40, diasContados: 3 })).toBe(true);
        expect(debeAlertar({ porcentaje: 40, diasContados: 2 })).toBe(false);
        expect(debeAlertar({ porcentaje: 50, diasContados: 5 })).toBe(false);
    });
});

describe('Singleton de la conexión', () => {
    test('connectDB devuelve siempre la misma conexión y conecta una sola vez', () => {
        jest.isolateModules(() => {
            const mongoose = require('mongoose');
            const espia = jest.spyOn(mongoose, 'connect').mockResolvedValue({ connection: { host: 'test' } });
            const uriOriginal = process.env.MONGODB_URI;
            process.env.MONGODB_URI = 'mongodb://test';
            const connectDB = require('../config/db');
            const a = connectDB();
            const b = connectDB();
            expect(a).toBe(b);
            expect(espia).toHaveBeenCalledTimes(1);
            espia.mockRestore();
            process.env.MONGODB_URI = uriOriginal;
        });
    });
});

describe('Observer', () => {
    test('un suscriptor que falla no frena a los demás', async () => {
        const bus = new BusDeEventos();
        const recibidos = [];
        const errorOriginal = console.error;
        console.error = jest.fn();
        bus.suscribir('x', () => { throw new Error('falla'); });
        bus.suscribir('x', (d) => recibidos.push(d.valor));
        bus.emitir('x', { valor: 1 });
        await esperar(10);
        console.error = errorOriginal;
        expect(recibidos).toEqual([1]);
    });

    describe('con la app', () => {
        beforeAll(db.conectar);
        afterEach(db.limpiar);
        afterAll(db.desconectar);

        async function usuarioConPlan(email) {
            usarEstrategiaIA(new IAFalsa({ dias: ['lunes', 'miercoles', 'viernes'] }));
            const reg = await request(app).post('/auth/register').send({ nombre: 'Obs', email, password: 'clave1234' });
            const auth = { Authorization: `Bearer ${reg.body.token}` };
            await request(app).post('/users/onboarding').set(auth).send({
                peso: 70, altura: 175, edad: 30, sexo: 'masculino', objetivo: 'perder grasa', nivel: 'intermedio',
                diasDispo: ['lunes', 'miercoles', 'viernes'], minutosPorSesion: 45, tipoDieta: 'normal', presupuesto: 20000, limitaciones: [],
            });
            const plan = await request(app).post('/plan/generar').set(auth).send({});
            return { auth, userId: reg.body.user._id, plan };
        }

        test('generar un plan y registrar un checkin quedan en la bitácora como eventos', async () => {
            const { auth, plan } = await usuarioConPlan('obs@test.com');
            expect(plan.status).toBe(200);
            await request(app).post('/checkins').set(auth).send({ rutina: 'completado', dieta: 'completado' });
            await esperar(150);
            const acciones = (await Bitacora.find({ metodo: 'EVENTO' }).lean()).map(b => b.accion);
            expect(acciones).toEqual(expect.arrayContaining(['Evento: plan generado', 'Evento: checkin registrado']));
        });

        test('con adherencia baja registra una sola alerta por día', async () => {
            const { userId } = await usuarioConPlan('baja@test.com');
            // el plan se generó hoy y los días anteriores no cuentan: se adelanta su fecha de creación
            await Plan.collection.updateMany({}, { $set: { createdAt: new Date(Date.now() - 10 * 86400000) } });
            const fechas = new AdherenciaSemanal().fechas().slice(-3);
            for (const fecha of fechas) {
                await Checkin.create({ userId, fecha, rutina: { estado: 'no_hice', puntaje: 0 }, dieta: { estado: 'no_hice', puntaje: 0 }, puntajeTotal: 0 });
            }
            const primera = await revisarAdherencia({ userId });
            const segunda = await revisarAdherencia({ userId });
            expect(primera.porcentaje).toBeLessThan(50);
            expect(segunda).toBeNull();
            expect(await Bitacora.countDocuments({ userId, accion: ACCION_ALERTA })).toBe(1);
        });
    });
});
