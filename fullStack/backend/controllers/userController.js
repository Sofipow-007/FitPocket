// -------------- Algunas funciones CRUD en el usuario (Actualizar, Leer, Borrar) --------------

const User = require('../models/User')
const {dispararPlan} = require('../services/webhookService')

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

exports.borrarPerfil = async (req, res) => {
    try {
        const { email } = req.body
        const user = await User.findOneAndDelete({ email })

        if (!user) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            })
        }

        res.json({
            message: 'Usuario eliminado correctamente',
            email: user.email
        });
    }
    catch (error) {
        console.error(error.message)
        res.status(500).send('Error en el servidor')
    }
}

// exports.onboarding1 = async (req, res) => {
//     try {
//         const { peso, altura, edad, sexo } = req.body
//         const usuario = await User.findByIdAndUpdate(
//             req.user.userId,
//             {
//                 perfil: {
//                     peso, altura, edad, sexo
//                 }
//             },
//             {
//                 new: true
//             } // Documento actualizado
//         )
//         res.json(usuario)
//     }
//     catch (error) {
//         console.error(error.message)
//         res.status(500).send('Error en el servidor')
//     }
// }

// exports.onboarding2 = async (req, res) => {
//     try {
//         const { objetivo, nivel } = req.body
//         const usuario = await User.findByIdAndUpdate(
//             req.user.userId,
//             {
//                 perfil: {
//                     objetivo, nivel
//                 }
//             },
//             {
//                 new: true
//             } // Documento actualizado
//         )
//         res.json(usuario)
//     }
//     catch (error) {
//         console.error(error.message)
//         res.status(500).send('Error en el servidor')
//     }
// }

exports.completarOnboarding = async (req, res) => {
    try {
        const {
            peso, altura, edad, sexo,
            objetivo, nivel, diasDispo,
            minutosPorSesion, tipoDieta,
            presupuesto, limitaciones
        } = req.body

        const usuario = await User.findByIdAndUpdate(
            req.user.userId,
            {
                perfil: {
                    peso, altura, edad, sexo,
                    objetivo, nivel, diasDispo,
                    minutosPorSesion, tipoDieta,
                    presupuesto, limitaciones
                }
            },
            {
                new: true
            } // Documento actualizado
        )

        if (!usuario) {
            return res.status(404).json({ error: "Usuario no encontrado" })
        }

        res.json({
            ok: true,
            mensaje: "Perfil guardado, generando plan"
        })

        // dispararPlan(req.userId, perfil)

        // para hacer: disparar webhook a N8N
    }
    catch (error) {
        res.status(500).json({ error: error.message })
    }
}
