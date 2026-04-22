// -------------- Algunas funciones CRUD en el usuario (Actualizar, Leer, Borrar) --------------

const User = require('../models/User')

exports.getInfo = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-passwordHash')
        if (!user) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            })
        }
        res.json(user)
    }
    catch (error) {
        console.error(error.message)
        res.status(500).send('Error en el servidor')
    }
}

exports.actualizarPerfil = async (req, res) => {
    try {
        const { perfil } = req.body
        const user = await User.findByIdAndUpdate(
            req.user.userId,
            {
                $set: { perfil }
            },
            {
                new: true,
                runValidators: true
            }
        ).select('-passwordHash')

        if (!user) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            })
        }
    }
    catch (error) {
        console.error(error.message)
        res.status(500).send('Error en el servidor')
    }
}