// controllers/timelineController.js
const { Post, User } = require('../models');
const path = require('path'); // Adicione esta linha para importar o módulo path

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
		  
		  // Importante: adiciona a propriedade images que o frontend espera
		  if (postObj.attachments && postObj.attachments.length > 0) {
			postObj.images = [...postObj.attachments]; // Copia os caminhos
		  } else {
			postObj.images = [];
		  }
		  
		  return postObj;
		});
	  
	console.log('Posts formatados para o frontend:', formattedPosts);
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
    console.log('Tentativa de criar post:', { text, user: req.usuario.id, files: req.files, eventData });
    
    if (!text && !eventData) {
      console.log('Texto vazio e sem dados de evento, rejeitando post');
      return res.status(400).json({ mensagem: 'O texto ou dados de evento são obrigatórios' });
    }
    
  // Processar anexos se houver arquivos enviados
	const attachments = req.files ? req.files.map(file => {
	  // Ajustar o caminho para o padrão /uploads/timeline/...
	  // Substitua qualquer caminho existente pelo padrão correto
	  const filename = path.basename(file.path);
	  return `/uploads/timeline/${filename}`;
	}) : [];
    
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
      attachments, // Usar diretamente como definido acima
      eventData: parsedEventData
    });
    
    const post = await newPost.save();
    console.log('Post salvo com sucesso:', post);
    
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