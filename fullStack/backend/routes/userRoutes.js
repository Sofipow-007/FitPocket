const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth')
const userControl = require('../controllers/userController')
const roles = require('../middleware/roles')

router.get('/perfil', auth, userControl.getInfo)
router.put('/actualizar', auth, userControl.actualizarPerfil)
router.delete('/borrar', auth, roles('admin'), userControl.borrarPerfil)

//ruta del onboarding
router.post('/onboarding', auth, userControl.completarOnboarding)

module.exports = router;