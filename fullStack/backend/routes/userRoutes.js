const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth')
const userControl = require('../controllers/userController')
const { getMisPermisos } = require('../controllers/permisosController')
const requierePatente = require('../middleware/requierePatente')

router.get('/perfil', auth, userControl.getInfo)
router.get('/permisos', auth, getMisPermisos)
router.get('/todos', auth, requierePatente('usuarios.listar'), userControl.getAllUsers)
router.put('/actualizar', auth, requierePatente('perfil.editar'), userControl.actualizarPerfil)
router.delete('/borrar', auth, requierePatente('cuenta.borrar'), userControl.borrarPerfil)
// borra la cuenta de otro usuario (va después de /borrar para no pisarla)
router.delete('/:id', auth, requierePatente('usuarios.borrar'), userControl.borrarUsuario)

//ruta del onboarding
router.post('/onboarding', auth, requierePatente('perfil.editar'), userControl.completarOnboarding)

// verifica integridad de la base de datos mediante DVV
router.get('/verificar-integridad', auth, requierePatente('integridad.verificar'), userControl.verificarIntegridad)

module.exports = router;
