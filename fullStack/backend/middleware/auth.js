const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ msg: 'No hay token, autorización denegada' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return res.status(401).json({ msg: 'Token inválido' });
    }

    // El JWT sigue siendo válido aunque la cuenta se haya borrado o la contraseña
    // haya cambiado: se confirma que el usuario exista y que el token sea posterior al cambio.
    try {
        const user = await User.findById(decoded.userId).select('passwordCambiadaEn');
        if (!user) {
            return res.status(401).json({ msg: 'Token inválido' });
        }
        if (user.passwordCambiadaEn && decoded.iat * 1000 < user.passwordCambiadaEn.getTime()) {
            return res.status(401).json({ msg: 'Token inválido' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Error interno del servidor' });
    }

    req.user = decoded; // { userId: '...' } queda disponible en todos los controllers
    next();
};