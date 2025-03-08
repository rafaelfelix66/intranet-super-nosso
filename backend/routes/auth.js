// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verificarToken = require('../middleware/auth'); // Atualizado

// @route   POST api/auth/register
// @desc    Registrar usuário
// @access  Public
router.post('/register', authController.register);

// @route   POST api/auth/login
// @desc    Autenticar usuário
// @access  Public
router.post('/login', authController.login);

// @route   GET api/auth/user
// @desc    Obter dados do usuário
// @access  Private
router.get('/user', verificarToken, async (req, res) => {
  const { User } = require('../models'); // Importar aqui
  try {
    const user = await User.findById(req.usuario.id).select('-senha');
    if (!user) return res.status(404).json({ mensagem: 'Usuário não encontrado' });
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ mensagem: 'Erro no servidor' });
  }
});

module.exports = router;