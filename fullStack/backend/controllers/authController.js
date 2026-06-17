// ---------- Archivo con las funciones register y login (autorizacion) ----------

const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { calcularDVH } = require('../utils/digitosVerificadores');

// POST /auth/register
exports.register = async (req, res) => {
    try {
        const { nombre, email, password } = req.body;

        // Validar si el usuario ya existe
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'El usuario ya existe' });
        }

        // Hashear contraseña 
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Crear documento en usuarios
        user = new User({
            nombre,
            email,
            passwordHash,
            perfil: {}
        });

        user.dvh = calcularDVH([user.email, user.nombre, user.rol]);
        await user.save();

        // Generar JWT
        const payload = { userId: user._id, rol: user.rol };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ token, user: { _id: user._id, nombre: user.nombre, email: user.email } });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor');
    }
};

// POST /auth/login 
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validar credenciales 
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Credenciales inválidas' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Credenciales inválidas' });
        }

        // Devolver JWT
        const payload = { userId: user._id, rol: user.rol };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({ 
            token, user: { 
                _id: user._id,
                nombre: user.nombre,
                email: user.email
            }
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor');
    }
};