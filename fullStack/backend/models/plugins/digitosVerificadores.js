const DigitoVerificadorVertical = require('../DigitoVerificadorVertical');
const { dvhDe, PROYECCION_DVH } = require('../../utils/digitosVerificadores');

// Plugin de Mongoose: mantiene el DVH de cada documento y el DVV de la colección
// en cada escritura, sin que cada controller tenga que acordarse de hacerlo.
// Cubre save/create, findOneAndUpdate, updateOne/updateMany y los borrados.

const OPERACIONES_UPDATE = ['findOneAndUpdate', 'updateOne', 'updateMany'];
const OPERACIONES_DELETE = ['findOneAndDelete', 'deleteOne', 'deleteMany'];

// Los recálculos de DVV de una misma colección se encadenan: si dos escrituras
// sumaran en paralelo, la más lenta podría guardar una suma vieja.
const colaDVV = new Map();

async function sumarDVH(Modelo) {
    const [r] = await Modelo.collection.aggregate([{ $group: { _id: null, total: { $sum: '$dvh' } } }]).toArray();
    return (r?.total ?? 0) % 100000;
}

function actualizarDVV(Modelo, coleccion) {
    const anterior = colaDVV.get(coleccion) ?? Promise.resolve();
    const siguiente = anterior.then(async () => {
        const dvv = await sumarDVH(Modelo);
        await DigitoVerificadorVertical.updateOne(
            { coleccion },
            { $set: { dvv, actualizadoEn: new Date() } },
            { upsert: true }
        );
    });
    // un error no puede trabar la cola para las escrituras siguientes
    colaDVV.set(coleccion, siguiente.catch(() => {}));
    return siguiente;
}

// Recalcula el DVH de los documentos indicados. Se escribe con el driver nativo
// para no volver a disparar los hooks de este mismo plugin.
async function recalcularDVHDe(Modelo, coleccion, ids) {
    if (!ids.length) return;
    const docs = await Modelo.collection
        .find({ _id: { $in: ids } }, { projection: proyeccionNativa(coleccion) })
        .toArray();
    const ops = docs
        .map(d => ({ id: d._id, dvh: dvhDe(coleccion, d), actual: d.dvh }))
        .filter(d => d.dvh !== d.actual)
        .map(d => ({ updateOne: { filter: { _id: d.id }, update: { $set: { dvh: d.dvh } } } }));
    if (ops.length) await Modelo.collection.bulkWrite(ops);
}

function proyeccionNativa(coleccion) {
    return Object.fromEntries(PROYECCION_DVH[coleccion].split(' ').map(c => [c, 1]));
}

function registrarError(coleccion, error) {
    console.error(`No se pudieron actualizar los dígitos verificadores de ${coleccion}:`, error.message);
}

module.exports = function pluginDigitosVerificadores(schema, { coleccion }) {
    schema.add({ dvh: { type: Number, default: 0 } });

    schema.pre('save', function () {
        this.dvh = dvhDe(coleccion, this);
    });

    schema.post('save', async function () {
        try {
            await actualizarDVV(this.constructor, coleccion);
        } catch (error) {
            registrarError(coleccion, error);
        }
    });

    // Antes del update se anotan los ids afectados: después del cambio
    // pueden dejar de coincidir con el filtro (ej. estado activo → archivado).
    schema.pre(OPERACIONES_UPDATE, async function () {
        const filtro = this.getFilter();
        const consulta = this.model.find(filtro).select('_id').lean();
        if (this.op !== 'updateMany') consulta.limit(1);
        this._idsDVH = (await consulta).map(d => d._id);
    });

    schema.post(OPERACIONES_UPDATE, async function (resultado) {
        try {
            const ids = [...(this._idsDVH || [])];
            if (resultado?._id) ids.push(resultado._id);              // findOneAndUpdate
            if (resultado?.upsertedId) ids.push(resultado.upsertedId); // updateOne con upsert
            await recalcularDVHDe(this.model, coleccion, ids);
            await actualizarDVV(this.model, coleccion);
        } catch (error) {
            registrarError(coleccion, error);
        }
    });

    schema.post(OPERACIONES_DELETE, async function () {
        try {
            await actualizarDVV(this.model, coleccion);
        } catch (error) {
            registrarError(coleccion, error);
        }
    });
};

module.exports.actualizarDVV = actualizarDVV;
module.exports.sumarDVH = sumarDVH;
