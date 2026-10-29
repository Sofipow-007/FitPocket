const { verificarTodo, recalcularTodo } = require('../services/integridadService')
const { eventos, EVENTOS } = require('../services/eventos')

// GET /integridad/verificar
exports.verificar = async (req, res) => {
    try {
        const resultado = await verificarTodo()
        if (!resultado.ok) {
            const alteradas = resultado.colecciones.filter(c => !c.ok)
            eventos.emitir(EVENTOS.INTEGRIDAD_ALTERADA, {
                userId: req.user.userId,
                colecciones: alteradas.map(c => c.coleccion),
                registrosAlterados: alteradas.reduce((n, c) => n + c.filasAlteradas.length, 0),
            })
        }
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
