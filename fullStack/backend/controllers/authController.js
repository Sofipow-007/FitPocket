const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { calcularDVH } = require('../utils/digitosVerificadores');
const { encrypt, decrypt } = require('../utils/crypto');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /auth/register
exports.register = async (req, res) => {
    try {
        const nombre = typeof req.body.nombre === 'string' ? req.body.nombre.trim() : '';
        const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
        const { password } = req.body;

        if (!nombre) {
            return res.status(400).json({ msg: 'El nombre es obligatorio' });
        }
        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).json({ msg: 'El email no es válido' });
        }
        if (typeof password !== 'string' || password.length < 8) {
            return res.status(400).json({ msg: 'La contraseña debe tener al menos 8 caracteres' });
        }

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'El usuario ya existe' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // DVH calculado sobre valores en texto plano antes de encriptar
        const rol = 'usuario';
        const dvh = calcularDVH([email, nombre, rol]);

        user = new User({
            nombre: encrypt(nombre),   // nombre encriptado en BD
            email,
            passwordHash,
            rol,
            perfil: {},
            dvh,
        });

        await user.save();

        const payload = { userId: user._id, rol: user.rol };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        // Responder con nombre en texto plano
        res.status(201).json({
            token,
            user: { _id: user._id, nombre, email },
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

// POST /auth/login
exports.login = async (req, res) => {
    try {
        const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
        const { password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Credenciales inválidas' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Credenciales inválidas' });
        }

        const payload = { userId: user._id, rol: user.rol };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: {
                _id: user._id,
                nombre: decrypt(user.nombre),  // desencriptar al devolver
                email: user.email,
            },
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};
