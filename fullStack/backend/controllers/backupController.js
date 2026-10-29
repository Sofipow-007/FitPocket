const { crearBackup, listarBackups, RETENCION } = require('../services/backupService')

// GET /backup — backups disponibles en el servidor, del más nuevo al más viejo
exports.listar = async (req, res) => {
    try {
        res.json({ ok: true, backups: await listarBackups(), retencion: RETENCION() })
    } catch (error) {
        console.error(error.message)
        res.status(500).json({ error: 'Error en el servidor' })
    }
}

// POST /backup — genera uno nuevo. El restore no tiene endpoint a propósito:
// reemplaza datos de toda la base y se hace con scripts/restore.js.
exports.crear = async (req, res) => {
    try {
        const backup = await crearBackup()
        res.status(201).json({
            ok: true,
            backup: {
                nombre: backup.nombre,
                creadoEn: backup.creadoEn,
                colecciones: backup.colecciones.length,
                documentos: backup.colecciones.reduce((n, c) => n + c.documentos, 0),
                bytes: backup.bytes,
                valido: true,
            },
            borrados: backup.borrados,
        })
    } catch (error) {
        console.error(error.message)
        res.status(500).json({ error: 'No se pudo generar el backup' })
    }
}
