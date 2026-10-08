const User = require('../models/User');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { enviarMailDeReset } = require('../services/mailService');
const { calcularDVH } = require('../utils/digitosVerificadores');
const { encrypt, decrypt } = require('../utils/crypto');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RESET_VALIDEZ_MIN = 30;
const RESET_ESPERA_ENTRE_PEDIDOS_MS = 60 * 1000;
const hashDeToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

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

// POST /auth/forgot-password
// Responde siempre lo mismo, exista o no la cuenta, para que el formulario
// no sirva para averiguar qué mails están registrados.
exports.forgotPassword = async (req, res) => {
    const respuesta = { msg: 'Si ese email tiene una cuenta, te enviamos un enlace para restablecer la contraseña.' };
    try {
        const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).json({ msg: 'El email no es válido' });
        }

        const user = await User.findOne({ email });
        const pedidoReciente = user?.resetPedidoEn && Date.now() - user.resetPedidoEn.getTime() < RESET_ESPERA_ENTRE_PEDIDOS_MS;

        if (user && !pedidoReciente) {
            const token = crypto.randomBytes(32).toString('hex');
            user.resetTokenHash = hashDeToken(token);
            user.resetTokenExpira = new Date(Date.now() + RESET_VALIDEZ_MIN * 60 * 1000);
            user.resetPedidoEn = new Date();
            await user.save();

            // sin await: el envío no demora la respuesta ni delata si la cuenta existe
            enviarMailDeReset({ email, token, idioma: req.body?.idioma, minutos: RESET_VALIDEZ_MIN })
                .catch(error => console.error('No se pudo enviar el mail de recuperación:', error.message));
        }

        res.json(respuesta);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

// POST /auth/reset-password
exports.resetPassword = async (req, res) => {
    try {
        const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
        const password = req.body?.password;

        if (typeof password !== 'string' || password.length < 8) {
            return res.status(400).json({ msg: 'La contraseña debe tener al menos 8 caracteres' });
        }

        const user = token && await User.findOne({
            resetTokenHash: hashDeToken(token),
            resetTokenExpira: { $gt: new Date() },
        });
        if (!user) {
            return res.status(400).json({ msg: 'El enlace no es válido o ya venció. Pedí uno nuevo.', codigo: 'ENLACE_INVALIDO' });
        }

        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(password, salt);
        user.resetTokenHash = undefined;
        user.resetTokenExpira = undefined;
        user.resetPedidoEn = undefined;
        // el "iat" de un JWT va en segundos: se redondea para que el token que se emite acá abajo siga valiendo
        user.passwordCambiadaEn = new Date(Math.floor(Date.now() / 1000) * 1000);
        await user.save();

        const jwtToken = jwt.sign({ userId: user._id, rol: user.rol }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({
            token: jwtToken,
            user: { _id: user._id, nombre: decrypt(user.nombre), email: user.email },
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};
