const User = require('../models/User')
const { calcularDVH, calcularDVV } = require('../utils/digitosVerificadores')
const { encrypt, decrypt } = require('../utils/crypto')

// Desencripta nombre y limitaciones antes de devolver al cliente
function decryptUser(user) {
    const obj = user.toObject ? user.toObject() : { ...user }
    obj.nombre = decrypt(obj.nombre)
    if (obj.perfil?.limitaciones?.length) {
        obj.perfil.limitaciones = obj.perfil.limitaciones.map(l => decrypt(l))
    }
    return obj
}

exports.getInfo = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-passwordHash')
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" })
        }
        res.json(decryptUser(user))
    }
    catch (error) {
        console.error(error.message)
        res.status(500).send('Error en el servidor')
    }
}

exports.actualizarPerfil = async (req, res) => {
    try {
        const { perfil } = req.body
        const user = await User.findById(req.user.userId)

        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" })
        }

        const nombrePlano = decrypt(user.nombre)
        const perfilActual = user.perfil ? user.perfil.toObject() : {}
        const perfilNuevo = { ...perfilActual, ...perfil }

        // Encriptar limitaciones solo si vienen nuevas del cliente (texto plano)
        if (perfil.limitaciones !== undefined) {
            perfilNuevo.limitaciones = (perfil.limitaciones || []).map(l => encrypt(l))
        }

        user.perfil = perfilNuevo
        user.dvh = calcularDVH([
            user.email, nombrePlano, user.rol,
            perfilNuevo.peso, perfilNuevo.altura, perfilNuevo.edad,
        ])
        await user.save()

        const resultado = user.toObject()
        delete resultado.passwordHash
        resultado.nombre = nombrePlano
        if (resultado.perfil?.limitaciones?.length) {
            resultado.perfil.limitaciones = resultado.perfil.limitaciones.map(l => decrypt(l))
        }

        res.json({ ok: true, user: resultado })
    }
    catch (error) {
        console.error(error.message)
        res.status(500).send('Error en el servidor')
    }
}

exports.borrarPerfil = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.user.userId)

        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" })
        }

        res.json({
            message: 'Usuario eliminado correctamente',
            email: user.email
        })
    }
    catch (error) {
        console.error(error.message)
        res.status(500).send('Error en el servidor')
    }
}

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-passwordHash')
        res.json({ ok: true, users })
    } catch (error) {
        console.error(error.message)
        res.status(500).send('Error en el servidor')
    }
}

exports.completarOnboarding = async (req, res) => {
    try {
        const {
            peso, altura, edad, sexo,
            objetivo, nivel, diasDispo,
            minutosPorSesion, tipoDieta,
            presupuesto, limitaciones,
            diasDisponibles
        } = req.body

        const user = await User.findById(req.user.userId)
        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" })
        }

        const nombrePlano = decrypt(user.nombre)
        const diasFinales = diasDispo ?? diasDisponibles

        user.perfil = {
            peso, altura, edad, sexo,
            objetivo, nivel,
            diasDispo: diasFinales,
            minutosPorSesion, tipoDieta,
            presupuesto,
            limitaciones: (limitaciones || []).map(l => encrypt(l)),
        }

        // DVH recalculado con valores en texto plano
        user.dvh = calcularDVH([
            user.email, nombrePlano, user.rol,
            peso, altura, edad,
        ])

        await user.save()

        res.json({ ok: true, mensaje: "Perfil guardado, generando plan" })
    }
    catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// GET /users/verificar-integridad — solo admin
// Calcula el DVV (suma de todos los DVH) y verifica integridad global
exports.verificarIntegridad = async (req, res) => {
    try {
        const users = await User.find({}).select('dvh email nombre')
        const dvv = calcularDVV(users)
        res.json({
            ok: true,
            totalUsuarios: users.length,
            dvv,
        })
    }
    catch (error) {
        console.error(error.message)
        res.status(500).send('Error en el servidor')
    }
}
