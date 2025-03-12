const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Importar modelos
const { User, File, Message, Chat } = require('./models');

// Configuração do app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
// Criar diretórios de upload necessários
const fs = require('fs');

// Criar diretórios de upload se não existirem
const createRequiredDirs = () => {
  const dirs = [
    path.join(__dirname, 'uploads'),
    path.join(__dirname, 'uploads/chat'),
    path.join(__dirname, 'uploads/files'),
    path.join(__dirname, 'uploads/knowledge'),
	path.join(__dirname, 'uploads/timeline')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Diretório ${dir} criado com sucesso`);
    }
  });
};

createRequiredDirs();

// Configuração de CORS para desenvolvimento e produção
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:8080',
      'http://127.0.0.1:8080',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Origem não permitida pelo CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  exposedHeaders: ['Content-Length', 'X-Requested-With', 'Authorization'],
  optionsSuccessStatus: 204
};

// Middleware
app.use(cors({
  origin: '*', // Permite todas as origens
  // Ou específico para o frontend:
  // origin: 'http://localhost:80',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/timeline', express.static(path.join(__dirname, 'uploads/timeline')));

// Middleware para logging de requisições
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`, {
    headers: {
      'content-type': req.headers['content-type'],
      'authorization': req.headers['authorization'] ? 'Bearer [REDACTED]' : 'none'
    },
    body: req.body ? '[PRESENT]' : '[EMPTY]'
  });
  next();
});

// Configuração do MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://admin:admin123@mongodb:27017/intranet?authSource=admin';

mongoose
  .connect(mongoURI)
  .then(() => console.log('Conectado ao MongoDB'))
  .catch((err) => console.error('Erro ao conectar ao MongoDB:', err));

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Rotas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/timeline', require('./routes/timeline'));
app.use('/api/knowledge', require('./routes/knowledge'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/files', require('./routes/files'));

// Configuração específica para pré-voo de upload de arquivos
app.options('/api/files/upload', cors(corsOptions));

// Middleware para verificar token (unificado)
const verificarToken = (req, res, next) => {
  console.log('Método:', req.method, 'URL:', req.url);
  const token = req.headers['x-auth-token'] || req.headers['authorization']?.split(' ')[1];
  console.log('Token recebido:', token);
  if (!token) {
    console.log('Erro: Token não fornecido');
    return res.status(401).json({ mensagem: 'Token não fornecido' });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log('Erro: Token inválido', err.message);
      return res.status(403).json({ mensagem: 'Token inválido' });
    }
    console.log('Token válido, usuário:', decoded);
    req.usuario = decoded;
    next();
  });
};

// Rotas de autenticação
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nome, email, senha, cargo, departamento } = req.body;
    const usuarioExistente = await User.findOne({ email });
    if (usuarioExistente) return res.status(400).json({ mensagem: 'Email já cadastrado' });
    const novoUsuario = new User({ nome, email, senha, cargo, departamento });
    await novoUsuario.save();
    const token = jwt.sign(
      { id: novoUsuario._id, email, nome },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.status(201).json({ mensagem: 'Usuário registrado com sucesso', token });
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao registrar usuário', error: error.message });
  }
});


app.get('/api/auth/user', verificarToken, async (req, res) => {
  try {
    const usuario = await User.findById(req.usuario.id, '-senha');
    if (!usuario) return res.status(404).json({ mensagem: 'Usuário não encontrado' });
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar usuário', error: error.message });
  }
});    
 
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    // Verificar se o usuário existe
    const usuario = await User.findOne({ email });
    if (!usuario) return res.status(404).json({ mensagem: 'Usuário não encontrado' });
    
    // Verificar senha (em produção, compare com bcrypt)
    if (usuario.senha !== senha) return res.status(401).json({ mensagem: 'Senha incorreta' });
    
    // Atualizar último acesso
    usuario.ultimoAcesso = new Date();
    await usuario.save();
    
    // Gerar token JWT
    const token = jwt.sign(
      { id: usuario._id, email: usuario.email, nome: usuario.nome },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      usuario: {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        cargo: usuario.cargo,
        departamento: usuario.departamento,
        avatar: usuario.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro no login', error: error.message });
  }
});

// Rotas de usuários
app.get('/api/usuarios', verificarToken, async (req, res) => {
  try {
    const usuarios = await User.find({}, '-senha');
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar usuários', error: error.message });
  }
});

app.get('/api/usuarios/eu', verificarToken, async (req, res) => {
  try {
    const usuario = await User.findById(req.usuario.id, '-senha');
    if (!usuario) return res.status(404).json({ mensagem: 'Usuário não encontrado' });
    
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar usuário', error: error.message });
  }
});

// Rotas de arquivos
app.post('/api/arquivos/upload', verificarToken, upload.single('arquivo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ mensagem: 'Nenhum arquivo enviado' });
    
    const novoArquivo = new File({
      nome: req.file.originalname,
      tipo: req.file.mimetype,
      tamanho: req.file.size,
      urlArquivo: `/uploads/${req.file.filename}`,
      proprietarioId: req.usuario.id,
      tags: req.body.tags ? req.body.tags.split(',') : []
    });
    
    await novoArquivo.save();
    
    res.status(201).json(novoArquivo);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao fazer upload', error: error.message });
  }
});

app.get('/api/arquivos', verificarToken, async (req, res) => {
  try {
    const arquivos = await File.find({
      $or: [
        { proprietarioId: req.usuario.id },
        { compartilhadoCom: req.usuario.id }
      ]
    });
    
    res.json(arquivos);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar arquivos', error: error.message });
  }
});

app.post('/api/arquivos/compartilhar/:id', verificarToken, async (req, res) => {
  try {
    const { usuariosIds } = req.body;
    
    const arquivo = await File.findById(req.params.id);
    if (!arquivo) return res.status(404).json({ mensagem: 'Arquivo não encontrado' });
    
    if (arquivo.proprietarioId !== req.usuario.id) {
      return res.status(403).json({ mensagem: 'Você não tem permissão para compartilhar este arquivo' });
    }
    
    // Adicionar usuários na lista de compartilhamento
    arquivo.compartilhadoCom = [...new Set([...arquivo.compartilhadoCom, ...usuariosIds])];
    await arquivo.save();
    
    res.json(arquivo);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao compartilhar arquivo', error: error.message });
  }
});

// Rotas de chat
app.post('/api/chats', verificarToken, async (req, res) => {
  try {
    const { participantes, nomeSala } = req.body;
    
    // Garantir que o criador está incluído
    const todosParticipantes = [...new Set([req.usuario.id, ...participantes])];
    
    const novoChat = new Chat({
      participantes: todosParticipantes,
      nomeSala
    });
    
    await novoChat.save();
    
    res.status(201).json(novoChat);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao criar chat', error: error.message });
  }
});

app.get('/api/chats', verificarToken, async (req, res) => {
  try {
    const chats = await Chat.find({
      participantes: req.usuario.id
    });
    
    res.json(chats);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar chats', error: error.message });
  }
});

app.get('/api/chats/:id/mensagens', verificarToken, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ mensagem: 'Chat não encontrado' });
    
    if (!chat.participantes.includes(req.usuario.id)) {
      return res.status(403).json({ mensagem: 'Você não tem acesso a este chat' });
    }
    
    const mensagens = await Message.find({ chatId: req.params.id })
      .sort({ dataEnvio: 1 });
    
    res.json(mensagens);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar mensagens', error: error.message });
  }
});

// Middleware para autenticação de socket
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Autenticação necessária'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.userName = decoded.nome;
    next();
  } catch (err) {
    next(new Error('Token inválido'));
  }
});

// Configuração do socket.io para chat em tempo real
io.on('connection', (socket) => {
  console.log('Novo cliente conectado');
  
  
  // Entrar em uma sala de chat
  socket.on('join-chat', (chatId) => {
    socket.join(chatId);
    console.log(`${socket.userName} entrou no chat ${chatId}`);
  });
  
    // Enviar mensagem
  socket.on('send-message', async (data) => {
    try {
      if (!socket.userId) return;
      const novaMensagem = new Message({
        chatId: data.chatId,
        remetente: socket.userId,
        conteudo: data.conteudo,
        anexos: data.anexos || []
      });
      await novaMensagem.save();
      await Chat.findByIdAndUpdate(data.chatId, { ultimaMensagem: new Date() });
      const populatedMessage = await Message.findById(novaMensagem._id).populate('remetente', 'nome');
      io.to(data.chatId).emit('new-message', {
        ...populatedMessage.toObject(),
        remetenteNome: socket.userName
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  });
	  
	  // Ouvir por marcação de leitura
  socket.on('markAsRead', async (data) => {
	 try {
		const { chatId } = data;  // Ajustado para seu modelo
		await Message.updateMany(
		  { chatId, remetente: { $ne: socket.userId }, lida: false },
		  { $set: { lida: true } }
		);
		io.to(chatId).emit('messagesRead', { chatId, userId: socket.userId });
	  } catch (err) {
		console.error('Erro ao marcar mensagens como lidas:', err);
	  }
	});
      
  
  // Notificação de "digitando"
  socket.on('typing', (data) => {
    socket.to(data.chatId).emit('user-typing', {
      userId: socket.userId,
      userName: socket.userName
    });
  });
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

// Criar pasta de uploads se não existir
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});