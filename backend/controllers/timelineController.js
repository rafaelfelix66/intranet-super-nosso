// controllers/timelineController.js
const { Post, User } = require('../models');
const path = require('path'); // Adicione esta linha para importar o módulo path

// Função para normalizar caminhos de arquivos
const normalizePath = (filePath) => {
  // Remover quaisquer caminhos de servidor como /app/routes/
  let normalizedPath = filePath.replace(/^\/app\/routes\//, '/');
  
  // Garantir que o caminho começa com /uploads/timeline/
  if (!normalizedPath.includes('/uploads/timeline/')) {
    // Se já tiver /uploads/ mas não /timeline/
    if (normalizedPath.includes('/uploads/')) {
      normalizedPath = normalizedPath.replace('/uploads/', '/uploads/timeline/');
    } 
    // Se não tiver /uploads/ no começo
    else if (!normalizedPath.startsWith('/uploads/')) {
      // Se já começar com /
      if (normalizedPath.startsWith('/')) {
        normalizedPath = `/uploads/timeline${normalizedPath}`;
      } else {
        normalizedPath = `/uploads/timeline/${normalizedPath}`;
      }
    }
  }
  
  return normalizedPath;
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
      
      // Garantir que o campo images existe
      if (!postObj.images) {
        postObj.images = [];
      }
      
      // Normalizar caminhos em attachments
      if (postObj.attachments && postObj.attachments.length > 0) {
        postObj.attachments = postObj.attachments.map(attachment => 
          typeof attachment === 'string' ? normalizePath(attachment) : attachment
        );
      }
      
      // Normalizar caminhos em images
      if (postObj.images && postObj.images.length > 0) {
        postObj.images = postObj.images.map(img => 
          typeof img === 'string' ? normalizePath(img) : img
        );
      }
      
      // Garantir que images tem os mesmos valores que attachments
      if (postObj.attachments && postObj.attachments.length > 0) {
        if (!postObj.images) postObj.images = [];
        
        // Adicionar a images quaisquer attachments que não estejam lá
        postObj.attachments.forEach(attachment => {
          if (!postObj.images.includes(attachment)) {
            postObj.images.push(attachment);
          }
        });
      }
      
      // Log detalhado para depuração
      console.log(`Post ${postObj._id} processado:`, {
        user: postObj.user ? postObj.user.nome : 'unknown',
        text: postObj.text.substr(0, 20) + (postObj.text.length > 20 ? '...' : ''),
        attachmentsCount: postObj.attachments ? postObj.attachments.length : 0,
        imagesCount: postObj.images ? postObj.images.length : 0
      });
      
      return postObj;
    });
    
    console.log('Posts formatados com sucesso:', 
      formattedPosts.length
    );
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
    console.log('Tentativa de criar post:', { text, user: req.usuario.id, files: req.files?.length || 0, eventData: !!eventData });
    
    if (!text && !eventData) {
      console.log('Texto vazio e sem dados de evento, rejeitando post');
      return res.status(400).json({ mensagem: 'O texto ou dados de evento são obrigatórios' });
    }
    
    // Processar anexos se houver arquivos enviados
    const attachments = req.files ? req.files.map(file => {
      // Ajustar o caminho para o padrão /uploads/timeline/...
      const filename = path.basename(file.path);
      const normalizedPath = `/uploads/timeline/${filename}`;
      console.log(`Processando arquivo: ${file.originalname} -> ${normalizedPath}`);
      return normalizedPath;
    }) : [];
    
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
    
    // Criar o objeto Post
    const newPost = new Post({
      text,
      user: req.usuario.id,
      attachments,
      eventData: parsedEventData,
      images: [...attachments] // Garantir que images tenha os mesmos valores que attachments
    });
    
    const post = await newPost.save();
    console.log('Post salvo com sucesso:', {
      id: post._id,
      text: post.text.substring(0, 30),
      attachments: post.attachments.length,
      images: post.images.length
    });
    
    // Carregar informações do usuário para a resposta
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