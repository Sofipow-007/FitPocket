const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register); // [cite: 158]
router.post('/login', authController.login); // [cite: 161]

module.exports = router;