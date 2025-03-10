// controllers/timelineController.js
const { Post, User } = require('../models');

// Obter todas as publicações
const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('user', ['nome'])
      .populate('comments.user', ['nome']);
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor');
  }
};

// Criar uma publicação
const createPost = async (req, res) => {
  try {
    const { text, eventData } = req.body;
    console.log('Tentativa de criar post:', { text, user: req.usuario.id, files: req.files, eventData });
    
    if (!text && !eventData) {
      console.log('Texto vazio e sem dados de evento, rejeitando post');
      return res.status(400).json({ mensagem: 'O texto ou dados de evento são obrigatórios' });
    }
    
    const attachments = req.files ? req.files.map(file => ({
      type: file.path,
      contentType: file.mimetype
    })) : [];
    
    // Processar dados do evento se forem fornecidos
    let parsedEventData = null;
    if (eventData) {
      try {
        parsedEventData = typeof eventData === 'string' ? JSON.parse(eventData) : eventData;
      } catch (error) {
        console.error('Erro ao analisar dados do evento:', error);
      }
    }
    
    const post = await newPost.save();
    console.log('Post salvo com sucesso:', post);
    
    const populatedPost = await Post.findById(post._id)
      .populate('user', ['nome']);
      
    res.status(201).json(populatedPost);
  } catch (err) {
    console.error('Erro ao criar post:', err.message);
    res.status(500).json({ mensagem: 'Erro ao criar post', erro: err.message });
  }
};
// Adicionar comentário
const addComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: 'Publicação não encontrada' });
    }
    const newComment = {
      text: req.body.text,
      user: req.usuario.id
    };
    post.comments.unshift(newComment);
    await post.save();
    const updatedPost = await Post.findById(post._id)
      .populate('user', ['nome'])
      .populate('comments.user', ['nome']);
    res.json(updatedPost);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Publicação não encontrada' });
    }
    res.status(500).send('Erro no servidor');
  }
};

// Curtir publicação
const likePost = async (req, res) => {
  try {
    console.log('Tentando curtir post. ID:', req.params.id, 'Usuário:', req.usuario);
    const post = await Post.findById(req.params.id);
    if (!post) {
      console.log('Post não encontrado:', req.params.id);
      return res.status(404).json({ msg: 'Publicação não encontrada' });
    }
    console.log('Post antes do like:', post);
    if (post.likes.some(like => like.toString() === req.usuario.id)) {
      console.log('Post já curtido por:', req.usuario.id);
      return res.status(400).json({ msg: 'Publicação já curtida' });
    }
    post.likes.unshift(req.usuario.id);
    await post.save();
    console.log('Post após like:', post);
    res.json(post.likes);
  } catch (err) {
    console.error('Erro no likePost:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Publicação não encontrada' });
    }
    res.status(500).send('Erro no servidor');
  }
};

// Exportar funções
module.exports = { getPosts, createPost, addComment, likePost };