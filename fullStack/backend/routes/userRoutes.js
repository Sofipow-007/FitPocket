const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth')
const userControl = require('../controllers/userController')

router.get('/perfil', auth, userControl.getInfo)
router.put('/actualizar', auth, userControl.actualizarPerfil)

module.exports = router;