const Patente = require('../models/Patente');
const Familia = require('../models/Familia');
const User = require('../models/User');

// Patrón Composite: una Patente (hoja) y una Familia (compuesto) se tratan igual,
// las dos saben responder qué patentes otorgan.

class ComponentePermiso {
    constructor(nombre) {
        this.nombre = nombre;
    }

    // Devuelve un Set con los códigos de patente que otorga este componente.
    // `visitados` evita recorrer dos veces la misma familia (ciclos o familias repetidas).
    obtenerPatentes(visitados = new Set()) { // eslint-disable-line no-unused-vars
        throw new Error('obtenerPatentes() no implementado');
    }
}

class PatenteHoja extends ComponentePermiso {
    obtenerPatentes() {
        return new Set([this.nombre]);
    }
}

class FamiliaCompuesta extends ComponentePermiso {
    constructor(nombre, id = null) {
        super(nombre);
        this.id = id;
        this.hijos = [];
    }

    agregar(hijo) {
        this.hijos.push(hijo);
        return this;
    }

    obtenerPatentes(visitados = new Set()) {
        const resultado = new Set();
        // Si la familia ya se recorrió, se corta: una familia que se contiene
        // a sí misma (directa o indirectamente) no entra en loop.
        if (this.id) {
            if (visitados.has(this.id)) return resultado;
            visitados.add(this.id);
        }
        for (const hijo of this.hijos) {
            for (const codigo of hijo.obtenerPatentes(visitados)) resultado.add(codigo);
        }
        return resultado;
    }
}

// ── Catálogo base ──

const PATENTES_BASE = [
    { codigo: 'plan.ver',              descripcion: 'Ver el plan propio y la adherencia' },
    { codigo: 'plan.generar',          descripcion: 'Generar o regenerar el plan con IA' },
    { codigo: 'checkin.registrar',     descripcion: 'Completar el checklist diario' },
    { codigo: 'perfil.editar',         descripcion: 'Editar el perfil y el onboarding' },
    { codigo: 'cuenta.borrar',         descripcion: 'Borrar la cuenta propia' },
    { codigo: 'usuarios.listar',       descripcion: 'Ver el listado de usuarios' },
    { codigo: 'usuarios.borrar',       descripcion: 'Borrar cuentas de otros usuarios' },
    { codigo: 'bitacora.ver',          descripcion: 'Consultar la bitácora' },
    { codigo: 'integridad.verificar',  descripcion: 'Verificar los dígitos verificadores' },
    { codigo: 'integridad.recalcular', descripcion: 'Recalcular los dígitos verificadores' },
    { codigo: 'backup.ejecutar',       descripcion: 'Generar un backup de la base' },
    { codigo: 'familias.gestionar',    descripcion: 'Crear y editar familias y asignar permisos' },
];

const FAMILIA_USUARIO = 'Usuario';
const FAMILIA_ADMIN = 'Administrador';

const FAMILIAS_BASE = [
    {
        nombre: FAMILIA_USUARIO,
        descripcion: 'Uso normal de la app',
        patentes: ['plan.ver', 'plan.generar', 'checkin.registrar', 'perfil.editar', 'cuenta.borrar'],
        familias: [],
    },
    {
        nombre: FAMILIA_ADMIN,
        descripcion: 'Todo lo de Usuario más la administración del sistema',
        patentes: ['usuarios.listar', 'usuarios.borrar', 'bitacora.ver', 'integridad.verificar',
            'integridad.recalcular', 'backup.ejecutar', 'familias.gestionar'],
        familias: [FAMILIA_USUARIO],
    },
];

// Crea las patentes y familias base si faltan. Es idempotente: con $addToSet
// no pisa lo que un admin haya agregado después desde la pantalla de familias.
async function asegurarPermisosBase() {
    for (const p of PATENTES_BASE) {
        await Patente.updateOne(
            { codigo: p.codigo },
            { $setOnInsert: { descripcion: p.descripcion } },
            { upsert: true }
        );
    }
    const patentes = await Patente.find({ codigo: { $in: PATENTES_BASE.map(p => p.codigo) } }).lean();
    const idPatente = Object.fromEntries(patentes.map(p => [p.codigo, p._id]));

    const familias = {};
    for (const f of FAMILIAS_BASE) {
        familias[f.nombre] = await Familia.findOneAndUpdate(
            { nombre: f.nombre },
            {
                $setOnInsert: { descripcion: f.descripcion },
                $addToSet: {
                    patentes: { $each: f.patentes.map(c => idPatente[c]) },
                    familias: { $each: f.familias.map(n => familias[n]._id) },
                },
            },
            { upsert: true, returnDocument: 'after' }
        );
    }
    return familias;
}

// Busca una familia base por nombre y la crea con todo el catálogo si todavía no existe
async function familiaBase(nombre) {
    const familia = await Familia.findOne({ nombre });
    if (familia) return familia;
    const creadas = await asegurarPermisosBase();
    return creadas[nombre];
}

// ── Armado del árbol ──

// Trae todas las familias con los códigos de sus patentes. Son pocas, así que
// conviene una sola consulta en vez de una por nivel del árbol.
async function cargarCatalogo() {
    const familias = await Familia.find().populate('patentes', 'codigo').lean();
    return new Map(familias.map(f => [String(f._id), f]));
}

// Una instancia por familia: si hay un ciclo en la base, queda un ciclo de objetos
// que obtenerPatentes() corta con `visitados`, en vez de recursión infinita al construir.
function construirFamilia(id, catalogo, cache = new Map()) {
    const clave = String(id);
    if (cache.has(clave)) return cache.get(clave);

    const datos = catalogo.get(clave);
    const familia = new FamiliaCompuesta(datos?.nombre ?? clave, clave);
    cache.set(clave, familia);
    if (!datos) return familia; // referencia a una familia borrada: no otorga nada

    for (const p of datos.patentes || []) {
        if (p?.codigo) familia.agregar(new PatenteHoja(p.codigo));
    }
    for (const hija of datos.familias || []) {
        familia.agregar(construirFamilia(hija, catalogo, cache));
    }
    return familia;
}

// Raíz del usuario: sus familias y sus patentes sueltas bajo un mismo compuesto
function arbolDeUsuario(user, catalogo) {
    const raiz = new FamiliaCompuesta('usuario');
    const cache = new Map();
    for (const id of user.familias || []) raiz.agregar(construirFamilia(id, catalogo, cache));
    for (const p of user.patentes || []) {
        if (p?.codigo) raiz.agregar(new PatenteHoja(p.codigo));
    }
    return raiz;
}

// Set con los códigos de patente efectivos del usuario (vacío si no existe)
async function permisosDeUsuario(userId) {
    const user = await User.findById(userId).select('familias patentes').populate('patentes', 'codigo').lean();
    if (!user) return new Set();
    const catalogo = await cargarCatalogo();
    return arbolDeUsuario(user, catalogo).obtenerPatentes();
}

// ¿Desde alguna de `familiasIds` se llega a `objetivoId`? Sirve para derivar el rol
// (llega a Administrador) y para rechazar una edición que formaría un ciclo.
function alcanza(familiasIds, objetivoId, catalogo) {
    const objetivo = String(objetivoId);
    const pendientes = (familiasIds || []).map(String);
    const vistos = new Set();
    while (pendientes.length) {
        const actual = pendientes.pop();
        if (actual === objetivo) return true;
        if (vistos.has(actual)) continue;
        vistos.add(actual);
        for (const hija of catalogo.get(actual)?.familias || []) pendientes.push(String(hija));
    }
    return false;
}

// El rol se deriva: es admin quien tenga la familia Administrador, directa o anidada
async function rolDerivado(familiasIds, catalogo) {
    const cat = catalogo || await cargarCatalogo();
    const admin = [...cat.values()].find(f => f.nombre === FAMILIA_ADMIN);
    return admin && alcanza(familiasIds, admin._id, cat) ? 'admin' : 'usuario';
}

module.exports = {
    ComponentePermiso,
    PatenteHoja,
    FamiliaCompuesta,
    PATENTES_BASE,
    FAMILIAS_BASE,
    FAMILIA_USUARIO,
    FAMILIA_ADMIN,
    asegurarPermisosBase,
    familiaBase,
    cargarCatalogo,
    construirFamilia,
    arbolDeUsuario,
    permisosDeUsuario,
    alcanza,
    rolDerivado,
};
