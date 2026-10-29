// Prueba de rendimiento: carga sostenida contra GET /plan/actual y GET /checkins/semana.
// Usa Mongo en memoria y la IA simulada (nunca Atlas ni Groq), con un usuario que ya
// tiene plan y una semana de checkins. Reporta latencia p50/p95/p99 y pedidos por
// segundo, y termina con error si algún p95 supera el umbral.
//
// Uso (desde fullStack/backend):  npm run test:perf
// Variables opcionales: PERF_DURACION_S (10), PERF_CONEXIONES (10), PERF_UMBRAL_P95_MS (200)
const path = require('path');
const fs = require('fs');
require('../helpers/entorno');

const autocannon = require('autocannon');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../app');
const Checkin = require('../../models/Checkin');
const { usarEstrategiaIA } = require('../../services/ia/iaFactory');
const IAFalsa = require('../helpers/iaFalsa');
const { AdherenciaSemanal } = require('../../services/adherenciaService');

const DURACION_S = Number(process.env.PERF_DURACION_S) || 10;
const CONEXIONES = Number(process.env.PERF_CONEXIONES) || 10;
const UMBRAL_P95_MS = Number(process.env.PERF_UMBRAL_P95_MS) || 200;
const SALIDA = path.join(__dirname, '..', '..', '..', '..', 'documentacion', 'pruebas');

const percentil = (ordenados, p) => ordenados[Math.min(ordenados.length - 1, Math.ceil((p / 100) * ordenados.length) - 1)];

async function sembrar(base) {
    const post = (ruta, body, token) => fetch(`${base}${ruta}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
        body: JSON.stringify(body),
    }).then(r => r.json());

    usarEstrategiaIA(new IAFalsa({ dias: ['lunes', 'miercoles', 'viernes'] }));
    const { token, user } = await post('/auth/register', { nombre: 'Perf', email: 'perf@test.com', password: 'clave1234' });
    await post('/users/onboarding', {
        peso: 75, altura: 178, edad: 32, sexo: 'masculino', objetivo: 'ganar músculo', nivel: 'intermedio',
        diasDispo: ['lunes', 'miercoles', 'viernes'], minutosPorSesion: 60, tipoDieta: 'normal', presupuesto: 30000, limitaciones: [],
    }, token);
    await post('/plan/generar', {}, token);
    for (const fecha of new AdherenciaSemanal().fechas()) {
        await Checkin.create({ userId: user._id, fecha, rutina: { estado: 'completado', puntaje: 1 }, dieta: { estado: 'parcial', puntaje: 0.5 }, puntajeTotal: 1.5 });
    }
    return token;
}

function medir(url, token) {
    return new Promise((resolve, reject) => {
        const latencias = [];
        let errores = 0;
        const instancia = autocannon({
            url,
            connections: CONEXIONES,
            duration: DURACION_S,
            headers: { Authorization: `Bearer ${token}` },
        }, (err, resultado) => {
            if (err) return reject(err);
            latencias.sort((a, b) => a - b);
            resolve({
                pedidos: resultado.requests.total,
                pedidosPorSegundo: Math.round(resultado.requests.average),
                errores: errores + resultado.errors + resultado.timeouts,
                p50: +percentil(latencias, 50).toFixed(1),
                p95: +percentil(latencias, 95).toFixed(1),
                p99: +percentil(latencias, 99).toFixed(1),
                max: +latencias.at(-1).toFixed(1),
            });
        });
        instancia.on('response', (cliente, status, bytes, tiempoMs) => {
            latencias.push(tiempoMs);
            if (status !== 200) errores++;
        });
    });
}

async function main() {
    const servidorMongo = await MongoMemoryServer.create();
    await mongoose.connect(servidorMongo.getUri());
    const servidor = app.listen(0);
    const base = `http://127.0.0.1:${servidor.address().port}`;

    try {
        const token = await sembrar(base);
        const resultados = [];
        for (const ruta of ['/plan/actual', '/checkins/semana']) {
            process.stdout.write(`Midiendo GET ${ruta} (${DURACION_S} s, ${CONEXIONES} conexiones)... `);
            const r = { ruta, ...(await medir(`${base}${ruta}`, token)) };
            r.ok = r.p95 <= UMBRAL_P95_MS && r.errores === 0;
            console.log(r.ok ? 'OK' : 'FALLA');
            resultados.push(r);
        }

        console.table(resultados.map(r => ({
            ruta: r.ruta, 'req/s': r.pedidosPorSegundo, 'p50 ms': r.p50, 'p95 ms': r.p95, 'p99 ms': r.p99, 'max ms': r.max, errores: r.errores,
        })));

        const fecha = new Date().toISOString();
        const entorno = `Node ${process.version}, ${require('os').cpus()[0]?.model ?? 'CPU desconocida'}, Mongo en memoria`;
        fs.mkdirSync(SALIDA, { recursive: true });
        fs.writeFileSync(path.join(SALIDA, 'rendimiento.json'), JSON.stringify({ fecha, entorno, duracionS: DURACION_S, conexiones: CONEXIONES, umbralP95Ms: UMBRAL_P95_MS, resultados }, null, 2) + '\n');
        fs.writeFileSync(path.join(SALIDA, 'rendimiento.md'), [
            '# Prueba de rendimiento',
            '',
            `Generado por \`npm run test:perf\` (fullStack/backend) el ${fecha.slice(0, 10)}.`,
            '',
            `- Entorno: ${entorno}. Sin red de por medio: mide la app y la base, no la conexión a Atlas.`,
            `- Carga: ${CONEXIONES} conexiones simultáneas durante ${DURACION_S} s por ruta, con un usuario que tiene plan y 7 checkins.`,
            '- Cada pedido pasa por todo lo real: JWT, consulta de permisos (patentes), la consulta en sí y el registro en la bitácora.',
            `- Criterio: p95 ≤ ${UMBRAL_P95_MS} ms y sin errores.`,
            '',
            '| Ruta | req/s | p50 (ms) | p95 (ms) | p99 (ms) | máx (ms) | Errores | Resultado |',
            '|---|---|---|---|---|---|---|---|',
            ...resultados.map(r => `| GET ${r.ruta} | ${r.pedidosPorSegundo} | ${r.p50} | ${r.p95} | ${r.p99} | ${r.max} | ${r.errores} | ${r.ok ? 'OK' : 'FALLA'} |`),
            '',
        ].join('\n'));
        console.log(`Resultados guardados en documentacion/pruebas/rendimiento.md`);

        if (!resultados.every(r => r.ok)) {
            console.error(`Alguna ruta superó el p95 de ${UMBRAL_P95_MS} ms o tuvo errores.`);
            process.exitCode = 1;
        }
    } finally {
        await new Promise(r => servidor.close(r));
        // la bitácora se escribe sin await al responder: se espera a que no queden escrituras pendientes
        const Bitacora = require('../../models/Bitacora');
        for (let antes = -1, ahora = await Bitacora.estimatedDocumentCount(); antes !== ahora; ) {
            await new Promise(r => setTimeout(r, 300));
            [antes, ahora] = [ahora, await Bitacora.estimatedDocumentCount()];
        }
        await mongoose.disconnect();
        await servidorMongo.stop();
    }
}

main().catch(err => {
    console.error(`La prueba de rendimiento no pudo correr: ${err.message}`);
    process.exitCode = 1;
});
