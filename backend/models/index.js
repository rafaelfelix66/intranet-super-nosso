// models/index.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  nome: String,
  email: { type: String, unique: true },
  password: String,
  cargo: String,
  departamento: String,
  avatar: String,
  dataCriacao: { type: Date, default: Date.now },
  ultimoAcesso: Date,
  permissoes: [String]
});

// Hash de senha antes de salvar
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Método para comparar senha
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const PostSchema = new mongoose.Schema({
  text: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  attachments: [{
    type: String, // Caminho do arquivo
    contentType: String // Tipo MIME
  }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    text: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

const ArticleSchema = new mongoose.Schema({
  title: String,
  content: String,
  category: String,
  tags: [String],
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  attachments: [{
    type: String, // Caminho do arquivo
    contentType: String,
    name: String // Nome original
  }],
  createdAt: { type: Date, default: Date.now }
});

const ChatSchema = new mongoose.Schema({
  name: String,
  type: { type: String, enum: ['direct', 'group'], default: 'group' },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastActivity: { type: Date, default: Date.now },
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const MessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
  text: String,
  attachments: [{
    type: String, // Caminho do arquivo
    contentType: String,
    name: String // Nome original
  }],
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const FileSchema = new mongoose.Schema({
  name: String,
  path: String,
  originalName: String,
  mimeType: String,
  size: Number,
  extension: String,
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sharedWith: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    access: { type: String, enum: ['read', 'write'], default: 'read' }
  }],
  isPublic: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const FolderSchema = new mongoose.Schema({
  name: String,
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sharedWith: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    access: { type: String, enum: ['read', 'write'], default: 'read' }
  }],
  isPublic: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = {
  User: mongoose.model('User', UserSchema),
  Post: mongoose.model('Post', PostSchema),
  Article: mongoose.model('Article', ArticleSchema),
  Chat: mongoose.model('Chat', ChatSchema), // Substitui ChatRoom
  Message: mongoose.model('Message', MessageSchema),
  File: mongoose.model('File', FileSchema),
  Folder: mongoose.model('Folder', FolderSchema)
};