const User = require('../models/User');
const Plan = require('../models/Plan');
const Checkin = require('../models/Checkin');
const DigitoVerificadorVertical = require('../models/DigitoVerificadorVertical');
const { actualizarDVV } = require('../models/plugins/digitosVerificadores');
const { dvhDe, calcularDVV, COLECCIONES_DVH, PROYECCION_DVH } = require('../utils/digitosVerificadores');

const MODELOS = { users: User, plans: Plan, checkins: Checkin };

// Dato para que el admin reconozca el registro sin abrir la base
function referencia(coleccion, doc) {
    if (coleccion === 'users') return doc.email;
    if (coleccion === 'checkins') return `${doc.userId} · ${doc.fecha}`;
    return `${doc.userId} · v${doc.version ?? 1}`;
}

// Recalcula el DVH de cada documento (no confía en el guardado) y compara
// la suma con el DVV guardado. Una fila editada a mano en la base aparece en
// filasAlteradas; una fila agregada o borrada por fuera cambia el DVV.
async function verificarColeccion(coleccion) {
    const Modelo = MODELOS[coleccion];
    const docs = await Modelo.find().select(PROYECCION_DVH[coleccion]).lean();
    const guardado = await DigitoVerificadorVertical.findOne({ coleccion }).lean();

    const filasAlteradas = [];
    const calculados = docs.map(d => {
        const dvh = dvhDe(coleccion, d);
        if (dvh !== d.dvh) {
            filasAlteradas.push({ id: d._id, coleccion, referencia: referencia(coleccion, d), dvhGuardado: d.dvh ?? null, dvhCalculado: dvh });
        }
        return dvh;
    });

    const dvvCalculado = calcularDVV(calculados);
    // Sin registro de DVV la suma esperada es 0: una colección vacía da OK, y una con
    // filas que nunca pasaron por el recálculo (datos viejos) queda marcada.
    const dvvGuardado = guardado?.dvv ?? 0;

    return {
        coleccion,
        totalRegistros: docs.length,
        filasAlteradas,
        dvvGuardado,
        dvvCalculado,
        ok: filasAlteradas.length === 0 && dvvGuardado === dvvCalculado,
    };
}

async function verificarTodo() {
    const colecciones = [];
    for (const c of COLECCIONES_DVH) colecciones.push(await verificarColeccion(c));
    return { ok: colecciones.every(c => c.ok), colecciones, verificadoEn: new Date() };
}

// Vuelve a calcular todos los DVH y los DVV: para después de una migración, un restore
// o para aceptar como válidos los datos actuales. Escribe con el driver nativo para no
// disparar los hooks del plugin documento por documento.
async function recalcularTodo() {
    const resumen = [];
    for (const coleccion of COLECCIONES_DVH) {
        const Modelo = MODELOS[coleccion];
        const docs = await Modelo.find().select(PROYECCION_DVH[coleccion]).lean();
        const ops = [];
        for (const d of docs) {
            const dvh = dvhDe(coleccion, d);
            if (dvh !== d.dvh) ops.push({ updateOne: { filter: { _id: d._id }, update: { $set: { dvh } } } });
        }
        if (ops.length) await Modelo.collection.bulkWrite(ops);
        await actualizarDVV(Modelo, coleccion);
        resumen.push({ coleccion, totalRegistros: docs.length, corregidos: ops.length });
    }
    return resumen;
}

module.exports = { verificarColeccion, verificarTodo, recalcularTodo, MODELOS };
