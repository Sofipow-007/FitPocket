const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const requierePatente = require('../middleware/requierePatente')
const bitacora = require('../controllers/bitacoraController')

router.get('/', auth, requierePatente('bitacora.ver'), bitacora.listar)
router.get('/acciones', auth, requierePatente('bitacora.ver'), bitacora.acciones)

module.exports = router
