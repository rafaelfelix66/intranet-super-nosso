// routes/files.js
const express = require('express');
const router = express.Router();
const filesController = require('../controllers/filesController');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Garantir que o diretório de uploads exista
const uploadsDir = path.join(__dirname, '../uploads/files');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuração do multer para uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// @route   GET api/files
// @desc    Obter arquivos e pastas
// @access  Private
router.get('/', auth, filesController.getFiles);

// @route   POST api/files/folder
// @desc    Criar nova pasta
// @access  Private
router.post('/folder', auth, filesController.createFolder);

// @route   POST api/files/upload
// @desc    Upload de arquivo
// @access  Private
router.post('/upload', auth, upload.single('file'), filesController.uploadFile);

// @route   GET api/files/download/:id
// @desc    Download de arquivo
// @access  Private
router.get('/download/:id', auth, filesController.downloadFile);

// @route   POST api/files/share
// @desc    Compartilhar arquivo ou pasta
// @access  Private
router.post('/share', auth, filesController.shareItem);

// @route   DELETE api/files/:itemType/:itemId
// @desc    Excluir arquivo ou pasta
// @access  Private
router.delete('/:itemType/:itemId', auth, filesController.deleteItem);

module.exports = router;