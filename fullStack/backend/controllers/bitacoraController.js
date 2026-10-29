const Bitacora = require('../models/Bitacora')
const User = require('../models/User')

const POR_PAGINA_DEFECTO = 25
const POR_PAGINA_MAX = 100
const FECHA = /^\d{4}-\d{2}-\d{2}$/

const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Las fechas del filtro son días calendario de Argentina (UTC-3, sin horario de verano)
const inicioDelDia = (fecha) => new Date(`${fecha}T00:00:00-03:00`)
const finDelDia = (fecha) => new Date(`${fecha}T23:59:59.999-03:00`)

// Arma el filtro de Mongo a partir de la query. Devuelve null si el filtro por
// email no coincide con ninguna cuenta (no hace falta consultar la bitácora).
async function armarFiltro({ email, accion, desde, hasta, estado }) {
    const filtro = {}

    if (typeof email === 'string' && email.trim()) {
        // la bitácora guarda el userId, no el email: se buscan las cuentas que coinciden
        const users = await User.find({ email: { $regex: escaparRegex(email.trim().toLowerCase()) } }).select('_id').lean()
        if (!users.length) return null
        filtro.userId = { $in: users.map(u => u._id) }
    }

    if (typeof accion === 'string' && accion.trim()) filtro.accion = accion.trim()

    const rango = {}
    if (FECHA.test(desde || '')) rango.$gte = inicioDelDia(desde)
    if (FECHA.test(hasta || '')) rango.$lte = finDelDia(hasta)
    if (Object.keys(rango).length) filtro.createdAt = rango

    // estado: un código exacto (404) o una familia (2xx, 4xx, 5xx)
    if (/^[1-5]xx$/i.test(estado || '')) {
        const base = Number(estado[0]) * 100
        filtro.statusCode = { $gte: base, $lt: base + 100 }
    } else if (/^\d{3}$/.test(estado || '')) {
        filtro.statusCode = Number(estado)
    }

    return filtro
}

// GET /bitacora?pagina=1&porPagina=25&email=&accion=&desde=YYYY-MM-DD&hasta=YYYY-MM-DD&estado=4xx
exports.listar = async (req, res) => {
    try {
        const pagina = Math.max(1, parseInt(req.query.pagina, 10) || 1)
        const porPagina = Math.min(POR_PAGINA_MAX, Math.max(1, parseInt(req.query.porPagina, 10) || POR_PAGINA_DEFECTO))

        const filtro = await armarFiltro(req.query)
        const ttlDias = Number(process.env.BITACORA_TTL_DIAS) || 180
        if (!filtro) return res.json({ ok: true, items: [], total: 0, pagina: 1, porPagina, paginas: 0, ttlDias })

        const [total, registros] = await Promise.all([
            Bitacora.countDocuments(filtro),
            Bitacora.find(filtro)
                .sort({ createdAt: -1 })
                .skip((pagina - 1) * porPagina)
                .limit(porPagina)
                .select('userId accion metodo ruta statusCode detalles createdAt')
                .populate('userId', 'email')
                .lean(),
        ])

        res.json({
            ok: true,
            items: registros.map(r => ({
                _id: r._id,
                fecha: r.createdAt,
                // el email se muestra desde la cuenta: la bitácora no lo guarda
                email: r.userId?.email ?? null,
                userId: r.userId?._id ?? r.userId ?? null,
                accion: r.accion,
                metodo: r.metodo,
                ruta: r.ruta,
                statusCode: r.statusCode ?? null,
                detalles: r.detalles,
            })),
            total,
            pagina,
            porPagina,
            paginas: Math.ceil(total / porPagina),
            ttlDias,
        })
    } catch (error) {
        console.error(error.message)
        res.status(500).json({ error: 'Error en el servidor' })
    }
}

// GET /bitacora/acciones — valores posibles para el filtro por acción
exports.acciones = async (req, res) => {
    try {
        const acciones = await Bitacora.distinct('accion')
        res.json({ ok: true, acciones: acciones.sort((a, b) => a.localeCompare(b, 'es')) })
    } catch (error) {
        console.error(error.message)
        res.status(500).json({ error: 'Error en el servidor' })
    }
}
