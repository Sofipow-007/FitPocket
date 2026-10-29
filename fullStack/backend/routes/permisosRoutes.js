const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const requierePatente = require('../middleware/requierePatente')
const permisos = require('../controllers/permisosController')

// Toda la gestión de familias y permisos requiere la misma patente
router.use(auth, requierePatente('familias.gestionar'))

router.get('/patentes', permisos.listarPatentes)
router.get('/familias', permisos.listarFamilias)
router.post('/familias', permisos.crearFamilia)
router.put('/familias/:id', permisos.editarFamilia)
router.put('/usuarios/:id', permisos.asignarAUsuario)

module.exports = router
