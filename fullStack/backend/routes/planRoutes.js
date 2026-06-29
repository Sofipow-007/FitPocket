const express = require('express')
const router = express.Router()
const { generarPlan, getPlanActual } = require('../controllers/planController')
const auth = require('../middleware/auth')

router.post('/generar', auth, generarPlan)
router.get('/actual', auth, getPlanActual)

module.exports = router