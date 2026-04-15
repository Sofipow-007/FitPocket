const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// POST /auth/register [cite: 158]
exports.register = async (req, res) => {
    try {
        const { nombre, email, password, perfil } = req.body;

        // Validar si el usuario ya existe
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'El usuario ya existe' });
        }

        // Hashear contraseña 
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Crear documento en usuarios [cite: 123]
        user = new User({
            nombre,
            email,
            passwordHash,
            perfil
        });

        await user.save();

        // Generar JWT [cite: 160]
        const payload = { userId: user._id };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        // NOTA: Aquí iría el disparador del webhook a N8N posteriormente [cite: 159]

        res.status(201).json({ token, user: { _id: user._id, nombre: user.nombre, email: user.email } });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor');
    }
};

// POST /auth/login [cite: 161]
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validar credenciales [cite: 163]
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Credenciales inválidas' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Credenciales inválidas' });
        }

        // Devolver JWT [cite: 163]
        const payload = { userId: user._id };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, user: { _id: user._id, nombre: user.nombre, email: user.email } });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor');
    }
};