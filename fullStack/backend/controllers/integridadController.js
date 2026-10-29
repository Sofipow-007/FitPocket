const { verificarTodo, recalcularTodo } = require('../services/integridadService')

// GET /integridad/verificar
exports.verificar = async (req, res) => {
    try {
        const resultado = await verificarTodo()
        res.json(resultado)
    } catch (error) {
        console.error(error.message)
        res.status(500).json({ error: 'Error en el servidor' })
    }
}

// POST /integridad/recalcular — queda en la bitácora como "Recálculo de dígitos verificadores"
exports.recalcular = async (req, res) => {
    try {
        const colecciones = await recalcularTodo()
        res.json({ ok: true, colecciones })
    } catch (error) {
        console.error(error.message)
        res.status(500).json({ error: 'Error en el servidor' })
    }
}
