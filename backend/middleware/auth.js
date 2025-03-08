// middleware/auth.js
const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
  const token = req.headers['x-auth-token'] || req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ mensagem: 'Token não fornecido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded; // Alinhado com server.js
    next();
  } catch (err) {
    res.status(403).json({ mensagem: 'Token inválido' });
  }
};

module.exports = verificarToken;