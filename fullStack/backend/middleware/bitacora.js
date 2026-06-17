const Bitacora = require('../models/Bitacora');

const ACCIONES = {
    'POST /auth/register': 'Registro de usuario',
    'POST /auth/login': 'Inicio de sesión',
    'GET /users/perfil': 'Consulta de perfil',
    'PUT /users/actualizar': 'Actualización de perfil',
    'DELETE /users/borrar': 'Eliminación de cuenta',
    'POST /users/onboarding': 'Completar onboarding',
    'POST /plan/generar': 'Generación de plan',
    'GET /plan/actual': 'Consulta de plan activo'
};

module.exports = (req, res, next) => {
    const original = res.json.bind(res);

    res.json = (body) => {
        const ruta = `${req.method} ${req.baseUrl}${req.path}`;
        const accion = ACCIONES[ruta] || ruta;

        Bitacora.create({
            userId: req.user?.userId || null,
            email: req.body?.email || null,
            accion,
            metodo: req.method,
            ruta: `${req.baseUrl}${req.path}`,
            ip: req.ip,
            detalles: res.statusCode >= 400 ? JSON.stringify(body) : null,
            statusCode: res.statusCode
        }).catch(err => console.error('Error bitácora:', err));

        return original(body);
    };

    next();
};