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

    // El JWT sigue siendo válido aunque la cuenta se haya borrado: se confirma que exista.
    try {
        if (!(await User.exists({ _id: decoded.userId }))) {
            return res.status(401).json({ msg: 'Token inválido' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Error interno del servidor' });
    }

    req.user = decoded; // { userId: '...' } queda disponible en todos los controllers
    next();
};