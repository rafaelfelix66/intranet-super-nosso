
// routes/timeline.js
const express = require('express');
const router = express.Router();
const timelineController = require('../controllers/timelineController');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
// Configuração do multer para uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
// Filtro para tipos de arquivo
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|mp4|webm|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado'), false);
  }
};
const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});
console.log('Registrando rotas da timeline...');
// @route   GET api/timeline
// @desc    Obter todas as publicações
// @access  Private
router.get('/', auth, timelineController.getPosts);
// @route   POST api/timeline
// @desc    Criar uma publicação
// @access  Private
router.post('/', auth, upload.array('attachments', 5), (req, res) => {
  console.log('Requisição POST /api/timeline recebida:', { 
    body: req.body, 
    files: req.files?.map(f => ({ name: f.originalname, path: f.path, type: f.mimetype })) || [] 
  });
  timelineController.createPost(req, res);
});

// @route   POST api/timeline/comment/:id
// @desc    Adicionar comentário a uma publicação
// @access  Private
router.post('/:id/comment', auth, timelineController.addComment);

// @route   PUT api/timeline/like/:id
// @desc    Curtir uma publicação
// @access  Private
router.put('/:id/like', auth, timelineController.likePost);
console.log('Rotas da timeline registradas com sucesso');

module.exports = router;