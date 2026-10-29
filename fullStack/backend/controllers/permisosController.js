const mongoose = require('mongoose')
const User = require('../models/User')
const Patente = require('../models/Patente')
const Familia = require('../models/Familia')
const { permisosDeUsuario, cargarCatalogo, alcanza, rolDerivado, FAMILIA_USUARIO, FAMILIA_ADMIN } = require('../services/permisosService')
const { dvhDeUsuario } = require('../utils/digitosVerificadores')
const { decrypt } = require('../utils/crypto')

const FAMILIAS_PROTEGIDAS = [FAMILIA_USUARIO, FAMILIA_ADMIN]

// Valida que `ids` sea un array de ObjectId existentes en `Modelo`. Devuelve los ids o null.
async function idsValidos(ids, Modelo) {
    if (ids === undefined) return []
    if (!Array.isArray(ids) || !ids.every(id => mongoose.isValidObjectId(id))) return null
    const unicos = [...new Set(ids.map(String))]
    const encontrados = await Modelo.countDocuments({ _id: { $in: unicos } })
    return encontrados === unicos.length ? unicos : null
}

function formatearFamilia(f) {
    return {
        _id: f._id,
        nombre: f.nombre,
        descripcion: f.descripcion,
        protegida: FAMILIAS_PROTEGIDAS.includes(f.nombre),
        patentes: f.patentes.map(p => p._id ?? p),
        familias: f.familias,
    }
}

// GET /users/permisos — patentes efectivas del usuario logueado
exports.getMisPermisos = async (req, res) => {
    try {
        const permisos = await permisosDeUsuario(req.user.userId)
        res.json({ ok: true, patentes: [...permisos].sort() })
    } catch (error) {
        console.error(error.message)
        res.status(500).json({ error: 'Error en el servidor' })
    }
}

// GET /permisos/patentes
exports.listarPatentes = async (req, res) => {
    try {
        const patentes = await Patente.find().select('codigo descripcion').sort({ codigo: 1 }).lean()
        res.json({ ok: true, patentes })
    } catch (error) {
        console.error(error.message)
        res.status(500).json({ error: 'Error en el servidor' })
    }
}

// GET /permisos/familias
exports.listarFamilias = async (req, res) => {
    try {
        const familias = await Familia.find().sort({ nombre: 1 }).lean()
        res.json({ ok: true, familias: familias.map(formatearFamilia) })
    } catch (error) {
        console.error(error.message)
        res.status(500).json({ error: 'Error en el servidor' })
    }
}

// Valida nombre, patentes y familias del body. `familiaId` es la familia que se edita
// (null al crear): sirve para rechazar que se incluya a sí misma o forme un ciclo.
async function validarFamilia(body, familiaId) {
    const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : ''
    if (!nombre || nombre.length > 40) return { error: 'El nombre es obligatorio (hasta 40 caracteres)' }

    const patentes = await idsValidos(body.patentes, Patente)
    if (!patentes) return { error: 'Alguna de las patentes no existe' }
    const familias = await idsValidos(body.familias, Familia)
    if (!familias) return { error: 'Alguna de las familias no existe' }

    if (familiaId) {
        const catalogo = await cargarCatalogo()
        if (alcanza(familias, familiaId, catalogo)) {
            return { error: 'Una familia no puede contenerse a sí misma (directa o indirectamente)' }
        }
    }

    const descripcion = typeof body.descripcion === 'string' ? body.descripcion.trim().slice(0, 200) : ''
    return { nombre, descripcion, patentes, familias }
}

// POST /permisos/familias
exports.crearFamilia = async (req, res) => {
    try {
        const datos = await validarFamilia(req.body ?? {}, null)
        if (datos.error) return res.status(400).json({ error: datos.error })

        if (await Familia.exists({ nombre: datos.nombre })) {
            return res.status(400).json({ error: 'Ya existe una familia con ese nombre' })
        }
        const familia = await Familia.create(datos)
        res.status(201).json({ ok: true, familia: formatearFamilia(familia.toObject()) })
    } catch (error) {
        console.error(error.message)
        res.status(500).json({ error: 'Error en el servidor' })
    }
}

// PUT /permisos/familias/:id
exports.editarFamilia = async (req, res) => {
    try {
        const { id } = req.params
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Id de familia inválido' })

        const familia = await Familia.findById(id)
        if (!familia) return res.status(404).json({ error: 'Familia no encontrada' })

        const datos = await validarFamilia(req.body ?? {}, id)
        if (datos.error) return res.status(400).json({ error: datos.error })

        // Usuario y Administrador las busca el código por nombre: no se pueden renombrar
        if (FAMILIAS_PROTEGIDAS.includes(familia.nombre) && datos.nombre !== familia.nombre) {
            return res.status(400).json({ error: 'Las familias base no se pueden renombrar' })
        }
        if (datos.nombre !== familia.nombre && await Familia.exists({ nombre: datos.nombre })) {
            return res.status(400).json({ error: 'Ya existe una familia con ese nombre' })
        }

        Object.assign(familia, datos)
        await familia.save()

        // Si la edición cambia quién llega a Administrador, el rol de esos usuarios cambia
        await sincronizarRoles()

        res.json({ ok: true, familia: formatearFamilia(familia.toObject()) })
    } catch (error) {
        console.error(error.message)
        res.status(500).json({ error: 'Error en el servidor' })
    }
}

// Actualiza rol y DVH de un usuario a partir de sus familias actuales
async function aplicarRol(user, catalogo) {
    const rol = await rolDerivado(user.familias, catalogo)
    if (rol === user.rol) return false
    user.rol = rol
    let nombrePlano = null
    try { nombrePlano = decrypt(user.nombre) } catch { /* nombre ilegible: lo corrige el recálculo de dígitos */ }
    user.dvh = dvhDeUsuario(user, nombrePlano)
    return true
}

async function sincronizarRoles() {
    const catalogo = await cargarCatalogo()
    const users = await User.find({ familias: { $exists: true, $ne: [] } })
    for (const u of users) {
        if (await aplicarRol(u, catalogo)) await u.save()
    }
}

// PUT /permisos/usuarios/:id — reemplaza las familias y patentes sueltas de un usuario
exports.asignarAUsuario = async (req, res) => {
    try {
        const { id } = req.params
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Id de usuario inválido' })

        // Así un admin no se puede quitar a sí mismo el acceso a esta pantalla por error
        if (String(id) === String(req.user.userId)) {
            return res.status(400).json({ error: 'No podés cambiar tus propios permisos' })
        }

        const user = await User.findById(id)
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })

        const familias = await idsValidos(req.body?.familias, Familia)
        if (!familias) return res.status(400).json({ error: 'Alguna de las familias no existe' })
        const patentes = await idsValidos(req.body?.patentes, Patente)
        if (!patentes) return res.status(400).json({ error: 'Alguna de las patentes no existe' })

        user.familias = familias
        user.patentes = patentes
        await aplicarRol(user, await cargarCatalogo())
        await user.save()

        res.json({ ok: true, usuario: { _id: user._id, rol: user.rol, familias: user.familias, patentes: user.patentes } })
    } catch (error) {
        console.error(error.message)
        res.status(500).json({ error: 'Error en el servidor' })
    }
}
