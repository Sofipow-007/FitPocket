const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const requierePatente = require('../middleware/requierePatente')
const integridad = require('../controllers/integridadController')

router.get('/verificar', auth, requierePatente('integridad.verificar'), integridad.verificar)
router.post('/recalcular', auth, requierePatente('integridad.recalcular'), integridad.recalcular)

module.exports = router
