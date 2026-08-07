const express = require('express')
const router  = express.Router()
const auth    = require('../middleware/auth')
const {
  registrarCheckin,
  getCheckinHoy,
  getAdherenciaSemana
} = require('../controllers/checkinController')

router.post('/',       auth, registrarCheckin)
router.get('/hoy',     auth, getCheckinHoy)
router.get('/semana',  auth, getAdherenciaSemana)

module.exports = router