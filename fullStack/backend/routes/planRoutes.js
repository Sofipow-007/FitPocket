const express = require('express')
const router = express.Router()
const { generarPlan, getPlanActual } = require('../controllers/planController')
const auth = require('../middleware/auth')
const requierePatente = require('../middleware/requierePatente')

router.post('/generar', auth, requierePatente('plan.generar'), generarPlan)
router.get('/actual', auth, requierePatente('plan.ver'), getPlanActual)

module.exports = router
