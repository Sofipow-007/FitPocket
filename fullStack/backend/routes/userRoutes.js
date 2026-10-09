const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth')
const userControl = require('../controllers/userController')
const roles = require('../middleware/roles')

router.get('/perfil', auth, userControl.getInfo)
router.get('/todos', auth, roles('admin'), userControl.getAllUsers)
router.put('/actualizar', auth, userControl.actualizarPerfil)
router.delete('/borrar', auth, userControl.borrarPerfil)
// solo admin: borra la cuenta de otro usuario (va después de /borrar para no pisarla)
router.delete('/:id', auth, roles('admin'), userControl.borrarUsuario)

//ruta del onboarding
router.post('/onboarding', auth, userControl.completarOnboarding)

// solo admin: verifica integridad de la base de datos mediante DVV
router.get('/verificar-integridad', auth, roles('admin'), userControl.verificarIntegridad)

module.exports = router;