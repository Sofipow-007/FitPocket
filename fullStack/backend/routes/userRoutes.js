const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth')
const userControl = require('../controllers/userController')

router.get('/perfil', auth, userControl.getInfo)
router.get('/todos', auth, userControl.getAllUsers)
router.put('/actualizar', auth, userControl.actualizarPerfil)
router.delete('/:email', auth, userControl.borrarPerfil)

//ruta del onboarding
router.post('/onboarding', auth, userControl.completarOnboarding)

module.exports = router;