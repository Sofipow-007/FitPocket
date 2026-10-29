const express = require('express')
const router  = express.Router()
const auth    = require('../middleware/auth')
const requierePatente = require('../middleware/requierePatente')
const {
  registrarCheckin,
  getCheckinHoy,
  getAdherenciaSemana
} = require('../controllers/checkinController')

router.post('/',       auth, requierePatente('checkin.registrar'), registrarCheckin)
router.get('/hoy',     auth, requierePatente('plan.ver'), getCheckinHoy)
router.get('/semana',  auth, requierePatente('plan.ver'), getAdherenciaSemana)

module.exports = router
