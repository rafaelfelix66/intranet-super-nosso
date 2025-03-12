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
    path.join(__dirname, 'uploads/knowledge')
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

// Para depuração, adicione este middleware
app.use('/uploads/*', (req, res, next) => {
  console.log('Tentando acessar arquivo estático:', req.url);
  const filePath = path.join(__dirname, req.url);
  console.log('Verificando se existe:', filePath);
  if (fs.existsSync(filePath)) {
    console.log('Arquivo encontrado!');
  } else {
    console.log('Arquivo não encontrado!');
  }
  next();
});

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
// Rota específica para arquivos de uploads com resposta de depuração
app.get('/api/arquivo/:filename', (req, res) => {
  const filename = req.params.filename;
  console.log(`Solicitação para arquivo: ${filename}`);
  
  // Tentar encontrar o arquivo em diferentes locais
  const possiblePaths = [
    path.join(__dirname, 'uploads', 'timeline', filename),
    path.join(__dirname, 'uploads', filename),
    path.join(__dirname, filename)
  ];
  
  // Procurar o arquivo em todos os caminhos possíveis
  let filePath = null;
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      filePath = testPath;
      console.log(`Arquivo encontrado em: ${filePath}`);
      break;
    }
  }
  
  if (filePath) {
    res.sendFile(filePath);
  } else {
    console.log(`Arquivo não encontrado: ${filename}`);
    console.log('Caminhos verificados:', possiblePaths);
    
    // Listar arquivos nos diretórios para ajudar na depuração
    try {
      const timelineDir = path.join(__dirname, 'uploads', 'timeline');
      const uploadsDir = path.join(__dirname, 'uploads');
      
      console.log('Conteúdo do diretório uploads/timeline:');
      if (fs.existsSync(timelineDir)) {
        console.log(fs.readdirSync(timelineDir));
      } else {
        console.log('Diretório não existe');
      }
      
      console.log('Conteúdo do diretório uploads:');
      if (fs.existsSync(uploadsDir)) {
        console.log(fs.readdirSync(uploadsDir));
      } else {
        console.log('Diretório não existe');
      }
    } catch (error) {
      console.error('Erro ao listar diretórios:', error);
    }
    
    res.status(404).send('Arquivo não encontrado');
  }
});

// Rota para verificar e listar todos os arquivos disponíveis
app.get('/api/arquivos-disponiveis', (req, res) => {
  console.log('Solicitação para listar arquivos disponíveis');
  
  try {
    const result = {
      uploadsDirExists: false,
      timelineDirExists: false,
      uploadsFiles: [],
      timelineFiles: []
    };
    
    const uploadsDir = path.join(__dirname, 'uploads');
    const timelineDir = path.join(__dirname, 'uploads', 'timeline');
    
    if (fs.existsSync(uploadsDir)) {
      result.uploadsDirExists = true;
      result.uploadsFiles = fs.readdirSync(uploadsDir);
    }
    
    if (fs.existsSync(timelineDir)) {
      result.timelineDirExists = true;
      result.timelineFiles = fs.readdirSync(timelineDir);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao listar arquivos disponíveis:', error);
    res.status(500).json({ error: error.message });
  }
});

// Adicionar uma rota de teste HTML para visualizar imagens
app.get('/api/teste-imagem', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Teste de Imagens</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        .image-container { margin: 20px 0; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
        .file-path { font-family: monospace; background: #f0f0f0; padding: 5px; margin: 5px 0; word-break: break-all; }
        img { max-width: 100%; border: 1px dashed #ccc; }
        .success { color: green; }
        .error { color: red; }
        .file-list { background: #f9f9f9; padding: 10px; margin: 10px 0; }
        button { padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #45a049; }
    </style>
</head>
<body>
    <h1>Teste de Visualização de Imagens</h1>
    
    <div>
        <button id="loadFilesBtn">Carregar Lista de Arquivos</button>
        <div id="fileListContainer" class="file-list" style="display: none;"></div>
    </div>
    
    <h2>Ver Arquivo Específico</h2>
    <div>
        <label for="fileInput">Nome do arquivo:</label>
        <input type="text" id="fileInput" value="1741744753758-427970592-super-nosso-logo.png" style="width: 300px; margin-right: 10px;">
        <button id="viewFileBtn">Visualizar</button>
    </div>
    
    <div id="imageContainer" class="image-container" style="display: none;">
        <h3>Visualização da Imagem</h3>
        <div id="filePath" class="file-path"></div>
        <div id="imageWrapper"></div>
    </div>
    
    <script>
        // Carregar lista de arquivos disponíveis
        document.getElementById('loadFilesBtn').addEventListener('click', async () => {
            try {
                const response = await fetch('/api/arquivos-disponiveis');
                const data = await response.json();
                
                const fileListContainer = document.getElementById('fileListContainer');
                fileListContainer.style.display = 'block';
                
                let html = '<h3>Arquivos Disponíveis</h3>';
                
                if (data.timelineDirExists) {
                    html += '<h4>Diretório /uploads/timeline/</h4>';
                    if (data.timelineFiles.length > 0) {
                        html += '<ul>';
                        data.timelineFiles.forEach(file => {
                            html += `<li><a href="#" class="file-link" data-path="timeline/${file}">${file}</a></li>`;
                        });
                        html += '</ul>';
                    } else {
                        html += '<p>Nenhum arquivo encontrado</p>';
                    }
                } else {
                    html += '<p class="error">O diretório /uploads/timeline/ não existe!</p>';
                }
                
                if (data.uploadsDirExists) {
                    html += '<h4>Diretório /uploads/</h4>';
                    if (data.uploadsFiles.length > 0) {
                        html += '<ul>';
                        data.uploadsFiles.forEach(file => {
                            if (file !== 'timeline') { // Não listar a pasta timeline
                                html += `<li><a href="#" class="file-link" data-path="${file}">${file}</a></li>`;
                            }
                        });
                        html += '</ul>';
                    } else {
                        html += '<p>Nenhum arquivo encontrado</p>';
                    }
                } else {
                    html += '<p class="error">O diretório /uploads/ não existe!</p>';
                }
                
                fileListContainer.innerHTML = html;
                
                // Adicionar eventos aos links de arquivo
                document.querySelectorAll('.file-link').forEach(link => {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        const filename = link.getAttribute('data-path');
                        document.getElementById('fileInput').value = filename;
                        document.getElementById('viewFileBtn').click();
                    });
                });
                
            } catch (error) {
                console.error('Erro ao carregar arquivos:', error);
                document.getElementById('fileListContainer').innerHTML = 
                    `<p class="error">Erro ao carregar lista de arquivos: ${error.message}</p>`;
                document.getElementById('fileListContainer').style.display = 'block';
            }
        });
        
        // Visualizar arquivo específico
        document.getElementById('viewFileBtn').addEventListener('click', () => {
            const filename = document.getElementById('fileInput').value.trim();
            if (!filename) return;
            
            const imageContainer = document.getElementById('imageContainer');
            const filePath = document.getElementById('filePath');
            const imageWrapper = document.getElementById('imageWrapper');
            
            imageContainer.style.display = 'block';
            filePath.textContent = `/api/arquivo/${filename}`;
            
            // Limpar conteúdo anterior
            imageWrapper.innerHTML = '';
            
            // Criar elemento de imagem
            const img = document.createElement('img');
            img.src = `/api/arquivo/${filename}`;
            img.alt = filename;
            
            // Eventos de sucesso e erro
            img.onload = () => {
                imageWrapper.appendChild(img);
                imageWrapper.innerHTML += '<p class="success">Imagem carregada com sucesso!</p>';
            };
            
            img.onerror = () => {
                imageWrapper.innerHTML = '<p class="error">Erro ao carregar a imagem. Verifique o nome do arquivo.</p>';
            };
            
            imageWrapper.appendChild(img);
        });
    </script>
</body>
</html>
  `);
});

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
const timelineUploadsDir = path.join(uploadsDir, 'timeline');
if (!fs.existsSync(timelineUploadsDir)) {
  fs.mkdirSync(timelineUploadsDir, { recursive: true });
}

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});