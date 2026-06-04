const express = require('express');
const router = express.Router();
const planControl = require('../controllers/planController.js')
const auth = require('../middleware/auth')

router.post('/generar', auth, planControl.generarPlan)
router.get('/actual', auth, planControl.getPlanActual)

module.exports = router;