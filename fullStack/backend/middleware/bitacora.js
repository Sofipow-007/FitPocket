const Bitacora = require('../models/Bitacora');

const ACCIONES = {
    'POST /auth/register': 'Registro de usuario',
    'POST /auth/login': 'Inicio de sesión',
    'GET /users/perfil': 'Consulta de perfil',
    'PUT /users/actualizar': 'Actualización de perfil',
    'DELETE /users/borrar': 'Eliminación de cuenta',
    'POST /users/onboarding': 'Completar onboarding',
    'POST /plan/generar': 'Generación de plan',
    'GET /plan/actual': 'Consulta de plan activo',
    'GET /users/todos': 'Listado de usuarios (admin)',
    'DELETE /users/:id': 'Eliminación de usuario por admin'
};

module.exports = (req, res, next) => {
    const original = res.json.bind(res);

    res.json = (body) => {
        // req.route.path conserva el patrón (/:id): así las rutas con parámetros
        // también tienen nombre. En `ruta` se guarda la URL real, con el id afectado.
        const ruta = `${req.method} ${req.baseUrl}${req.route?.path || req.path}`;
        const accion = ACCIONES[ruta] || ruta;

        // No se guarda el email en texto plano ni el body de error completo
        // (podría traer datos del usuario): solo el mensaje de error, que es
        // un texto fijo definido por el backend, no un dato del request.
        Bitacora.create({
            userId: req.user?.userId || null,
            accion,
            metodo: req.method,
            ruta: `${req.baseUrl}${req.path}`,
            ip: req.ip,
            detalles: res.statusCode >= 400 ? (body?.error || body?.msg || body?.message || null) : null,
            statusCode: res.statusCode
        }).catch(err => console.error('Error bitácora:', err));

        return original(body);
    };

    next();
};