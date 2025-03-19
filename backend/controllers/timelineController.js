// controllers/timelineController.js
const { Post, User } = require('../models');
const path = require('path');

// Função melhorada para normalizar caminhos de arquivos
const normalizePath = (filePath) => {
  if (!filePath) return '';
  
  // Se já for uma URL completa, retorna como está
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  
  // Obter apenas o nome do arquivo, ignorando qualquer diretório
  const filename = path.basename(filePath);
  
  // Retornar caminho padronizado
  return `/uploads/timeline/${filename}`;
};

// Obter todas as publicações
const getPosts = async (req, res) => {
  try {
    console.log('Buscando posts para o usuário:', req.usuario.id);
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('user', ['nome'])
      .populate('comments.user', ['nome']);
    console.log(`Encontrados ${posts.length} posts`);
    
    // Converter os posts para o formato esperado pelo frontend
    const formattedPosts = posts.map(post => {
      // Converte o post para um objeto simples (sem métodos do mongoose)
      const postObj = post.toObject();
      
      // Normalizar caminhos em attachments
      if (postObj.attachments && postObj.attachments.length > 0) {
        postObj.attachments = postObj.attachments.map(attachment => {
          if (typeof attachment === 'string') {
            return normalizePath(attachment);
          }
          return attachment;
        });
      }
      
      // Garantir que o campo images existe e contém os mesmos valores que attachments
      postObj.images = [];
      if (postObj.attachments && postObj.attachments.length > 0) {
        postObj.images = [...postObj.attachments];
      }
      
      // Log detalhado para depuração
      console.log(`Post ${postObj._id} processado:`, {
        user: postObj.user ? postObj.user.nome : 'unknown',
        text: postObj.text.substr(0, 20) + (postObj.text.length > 20 ? '...' : ''),
        attachmentsCount: postObj.attachments ? postObj.attachments.length : 0,
        imagesCount: postObj.images ? postObj.images.length : 0,
        attachments: postObj.attachments,
        images: postObj.images
      });
      
      return postObj;
    });
    
    console.log('Posts formatados com sucesso:', formattedPosts.length);
    return res.json(formattedPosts);
  } catch (err) {
    console.error('Erro ao buscar posts:', err.message);
    res.status(500).send('Erro no servidor');
  }
};

// Criar uma publicação
const createPost = async (req, res) => {
  try {
    const { text, eventData } = req.body;
    console.log('Tentativa de criar post:', { 
      text, 
      user: req.usuario.id, 
      files: req.files ? req.files.length : 0,
      eventData: !!eventData 
    });
    
    if (!text && !eventData) {
      console.log('Texto vazio e sem dados de evento, rejeitando post');
      return res.status(400).json({ mensagem: 'O texto ou dados de evento são obrigatórios' });
    }
    
    // Verificar como os arquivos são enviados pelo Multer
    console.log('Detalhes de req.files:', 
      req.files ? JSON.stringify(req.files.map(f => ({ name: f.originalname, path: f.path }))) : 'Nenhum arquivo'
    );
    
    // Processar anexos se houver arquivos enviados
    let attachments = [];
    
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      attachments = req.files.map(file => {
        const filename = path.basename(file.path);
        const normalizedPath = `/uploads/timeline/${filename}`;
        console.log(`Processando arquivo: ${file.originalname} -> ${normalizedPath} (${file.mimetype})`);
        return {
          path: normalizedPath,
          contentType: file.mimetype,
          name: file.originalname
        };
      });
    }
    
    console.log('Anexos processados:', attachments);
    
    // Processar dados do evento se forem fornecidos
    let parsedEventData = null;
    if (eventData) {
      try {
        parsedEventData = typeof eventData === 'string' ? JSON.parse(eventData) : eventData;
        console.log('Dados do evento processados:', parsedEventData);
      } catch (error) {
        console.error('Erro ao analisar dados do evento:', error);
      }
    }
    
    // Criar o objeto Post com os caminhos normalizados
    const normalizedAttachments = attachments.map(att => att.path);
    
    const newPost = new Post({
      text,
      user: req.usuario.id,
      attachments: normalizedAttachments,
      eventData: parsedEventData,
      images: normalizedAttachments
    });
    
    const post = await newPost.save();
    console.log('Post salvo com sucesso:', {
      id: post._id,
      text: post.text ? post.text.substring(0, 30) : '',
      attachmentsLength: post.attachments ? post.attachments.length : 0,
      imagesLength: post.images ? post.images.length : 0
    });
    
    // Carregar informações do usuário para a resposta
    const populatedPost = await Post.findById(post._id)
      .populate('user', ['nome']);
      
    res.status(201).json(populatedPost);
  } catch (err) {
    console.error('Erro ao criar post:', err);
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
    
    // Verificar se já curtiu e remover se sim, adicionar se não
    const index = post.likes.findIndex(like => like.toString() === req.usuario.id);
    if (index !== -1) {
      // Já curtiu, então remover
      console.log('Post já curtido, removendo curtida de:', req.usuario.id);
      post.likes.splice(index, 1);
    } else {
      // Ainda não curtiu, adicionar
      console.log('Adicionando curtida de:', req.usuario.id);
      post.likes.unshift(req.usuario.id);
    }
    
    await post.save();
    console.log('Post após like/unlike:', post);
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