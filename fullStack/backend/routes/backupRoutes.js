const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const requierePatente = require('../middleware/requierePatente')
const backup = require('../controllers/backupController')

router.get('/', auth, requierePatente('backup.ejecutar'), backup.listar)
router.post('/', auth, requierePatente('backup.ejecutar'), backup.crear)

module.exports = router
