const { permisosDeUsuario } = require('../services/permisosService');

// Uso: router.get('/todos', auth, requierePatente('usuarios.listar'), ...)
// Los permisos se calculan en cada request desde la base: si a alguien le sacan
// una familia, pierde el acceso en el momento y no cuando venza su JWT.
module.exports = (...codigos) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        try {
            const permisos = await permisosDeUsuario(req.user.userId);
            if (!codigos.every(c => permisos.has(c))) {
                return res.status(403).json({ error: 'No tenés permisos para esta acción' });
            }
            req.permisos = permisos;
            next();
        } catch (error) {
            console.error(error.message);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    };
};
