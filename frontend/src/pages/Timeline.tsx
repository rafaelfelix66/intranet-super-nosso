import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  MessageCircle, 
  MoreHorizontal, 
  Image as ImageIcon,
  Film,
  Calendar,
  Plus,
  X
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/components/ui/use-toast";
import { api } from '@/services/api';

// Interfaces
interface PostComment {
  id: string;
  user: {
    name: string;
    avatar?: string;
    initials: string;
  };
  content: string;
  timestamp: string;
}

interface Post {
  id: string;
  user: {
    name: string;
    avatar?: string;
    initials: string;
  };
  content: string;
  images?: string[];
  video?: string;
  timestamp: string;
  likes: number;
  comments: PostComment[];
  liked: boolean;
  event?: {
    title: string;
    date: string;
    location: string;
  };
}

// Dados iniciais
const initialPosts: Post[] = [];

// Funções auxiliares integradas
const getInitials = (name: string) => {
  if (!name) return '??';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const formatTimestamp = (date: string | Date) => {
  if (!date) return 'algum momento';
  
  const now = new Date();
  const postDate = new Date(date);
  const diff = Math.floor((now.getTime() - postDate.getTime()) / 1000);
  
  if (diff < 60) {
    return 'agora';
  } else if (diff < 3600) {
    const minutes = Math.floor(diff / 60);
    return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'} atrás`;
  } else if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `${hours} ${hours === 1 ? 'hora' : 'horas'} atrás`;
  } else if (diff < 604800) {
    const days = Math.floor(diff / 86400);
    return `${days} ${days === 1 ? 'dia' : 'dias'} atrás`;
  } else {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
};

// Determinar o URL base para as imagens com base no ambiente
const getBaseUrl = () => {
  if (window.location.hostname !== 'localhost') {
    return '';  // Em produção, os caminhos são relativos
  }
  return 'http://localhost:3000'; // Em desenvolvimento local
};

// Funções de integração com a API
const normalizePath = (path: string): string => {
  if (!path) return '';
  
  // Não modificar URLs absolutas
  if (path.startsWith('http')) {
    return path;
  }
  
  // Garantir que o caminho comece com /
  let normalizedPath = path;
  if (!normalizedPath.startsWith('/')) {
    normalizedPath = `/${normalizedPath}`;
  }
  
  // Não precisamos alterar o caminho, apenas retorná-lo como está
  // O componente ImageRenderer vai lidar com a conversão para URL completa
  
  console.log(`Caminho normalizado: ${path} -> ${normalizedPath}`);
  return normalizedPath;
};

const fetchPosts = async () => {
  try {
    const data = await api.get('/timeline');
    
    if (Array.isArray(data)) {
      const userId = localStorage.getItem('userId');
      console.log("ID do usuário atual:", userId);
      
      const formattedPosts = data.map(post => {
        console.log(`Post ${post._id}:`, {
          text: post.text ? post.text.substring(0, 30) : "Sem texto",
          hasAttachments: !!post.attachments && post.attachments.length > 0,
          hasImages: !!post.images && post.images.length > 0,
          attachments: post.attachments,
          images: post.images
        });
        
        const formattedPost = {
          id: post._id,
          user: {
            name: post.user?.nome || 'Usuário',
            initials: getInitials(post.user?.nome || 'Usuário')
          },
          content: post.text || "",
          timestamp: formatTimestamp(post.createdAt),
          likes: post.likes?.length || 0,
          comments: (post.comments || []).map(comment => ({
            id: comment._id,
            user: {
              name: comment.user?.nome || 'Usuário',
              initials: getInitials(comment.user?.nome || 'Usuário')
            },
            content: comment.text,
            timestamp: formatTimestamp(comment.createdAt)
          })),
          liked: post.likes?.some(like => 
            like.toString() === userId || 
            like === userId
          ) || false,
          images: [] // Inicializar array vazio
        };
        
        // Processamento de attachments e images
        // Primeiro, verificar campo images
        if (post.images && post.images.length > 0) {
          formattedPost.images = post.images
            .filter(img => img) // Filtrar valores vazios
            .map(img => typeof img === 'string' ? normalizePath(img) : 
                       (img.type ? normalizePath(img.type) : ''))
            .filter(Boolean);
        }
        
        // Se images estiver vazio, tentar attachments
        if ((!formattedPost.images || formattedPost.images.length === 0) && post.attachments && post.attachments.length > 0) {
          formattedPost.images = post.attachments
            .filter(attachment => attachment) // Filtrar valores vazios
            .map(attachment => {
              if (typeof attachment === 'string') {
                return normalizePath(attachment);
              } else if (attachment.type) {
                return normalizePath(attachment.type);
              }
              return '';
            })
            .filter(Boolean);
        }
        
        console.log(`Post ${post._id} - imagens processadas:`, formattedPost.images);
        
        // Processamento de eventos
        if (post.eventData) {
          try {
            formattedPost.event = typeof post.eventData === 'string' 
              ? JSON.parse(post.eventData)
              : post.eventData;
          } catch (e) {
            console.error('Erro ao processar dados do evento:', e);
          }
        }
        
        return formattedPost;
      });
      
      return formattedPosts;
    } else {
      console.error('Resposta do backend não é um array:', data);
      return [];
    }
  } catch (error) {
    console.error('Erro ao carregar posts:', error);
    throw new Error('Não foi possível carregar os posts');
  }
};

// Componente melhorado para renderizar imagens com tratamento de erro
const ImageRenderer = ({ src, alt, className }) => {
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>("");

  useEffect(() => {
    setError(false);
    if (!src || typeof src !== 'string') {
      setError(true);
      setCurrentSrc("https://via.placeholder.com/400x300?text=Imagem+não+disponível");
      return;
    }
    // Usar o caminho relativo para que o proxy (Nginx) redirecione para o backend
    const fullSrc = `http://127.0.0.1${src}`; // Ex.: "/uploads/timeline/..."
    console.log('Caminho da imagem:', {
      original: src,
      normalizado: fullSrc
    });
    setCurrentSrc(fullSrc);
  }, [src]);

  const handleError = () => {
    console.error(`Erro ao carregar imagem: ${currentSrc}`);
    setError(true);
    setCurrentSrc("https://via.placeholder.com/400x300?text=Imagem+não+disponível");
  };

  return (
    <>
      <img 
        src={currentSrc}
        alt={alt}
        className={className}
        onError={handleError}
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-80 text-gray-500 text-xs p-2 text-center">
          Não foi possível carregar a imagem
        </div>
      )}
    </>
  );
};

const createNewPostApi = async (
  text: string, 
  files: File[], 
  eventData?: { title: string; date: string; location: string }
) => {
  try {
    const formData = new FormData();
    
    if (text) {
      formData.append('text', text);
    }
    
    if (files.length > 0) {
      files.forEach(file => {
        formData.append('attachments', file);
      });
    }
    
    if (eventData) {
      formData.append('eventData', JSON.stringify(eventData));
    }
    
    console.log("Enviando formData:", {
      text,
      filesCount: files.length,
      eventData: eventData ? 'presente' : 'ausente'
    });
    
    const data = await api.upload('/timeline', formData);
    console.log("Resposta do servidor:", data);
    
    const formattedPost = {
      id: data._id,
      user: {
        name: data.user?.nome || 'Você',
        initials: data.user?.nome ? getInitials(data.user.nome) : 'VC'
      },
      content: data.text || "",
      timestamp: 'agora',
      likes: data.likes?.length || 0,
      comments: [],
      liked: false,
      images: []
    };
    
    // Processar imagens/anexos
    if (data.attachments && data.attachments.length > 0) {
      formattedPost.images = data.attachments.map(att => {
        if (typeof att === 'string') {
          return normalizePath(att);
        } else if (att.type) {
          return normalizePath(att.type);
        }
        return '';
      }).filter(Boolean);
    }
    
    if (data.eventData) {
      try {
        formattedPost.event = typeof data.eventData === 'string' 
          ? JSON.parse(data.eventData)
          : data.eventData;
      } catch (e) {
        console.error('Erro ao processar dados do evento:', e);
      }
    }
    
    return formattedPost;
  } catch (error) {
    console.error('Erro ao criar post:', error);
    throw new Error('Não foi possível criar a publicação');
  }
};

const toggleLikePost = async (postId: string) => {
  try {
    const updatedLikes = await api.put(`/timeline/${postId}/like`);
    return updatedLikes;
  } catch (error) {
    console.error('Erro ao curtir post:', error);
    throw new Error('Não foi possível curtir a publicação');
  }
};

const addComment = async (postId: string, text: string) => {
  try {
    const updatedPost = await api.post(`/timeline/${postId}/comment`, { text });
    
    const formattedComments = updatedPost.comments.map(comment => ({
      id: comment._id,
      user: {
        name: comment.user?.nome || 'Usuário',
        initials: getInitials(comment.user?.nome || 'Usuário')
      },
      content: comment.text,
      timestamp: formatTimestamp(comment.createdAt)
    }));
    
    return formattedComments;
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    throw new Error('Não foi possível adicionar o comentário');
  }
};

// Componente Timeline
const Timeline = () => {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("todos");
  const [newPostDialog, setNewPostDialog] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDate, setEventDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const loadPosts = async () => {
      if (!token) {
        console.error('Token não encontrado');
        navigate('/login');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const fetchedPosts = await fetchPosts();
        setPosts(fetchedPosts);
      } catch (error) {
        setError('Não foi possível carregar os posts');
        toast({ 
          title: "Erro", 
          description: "Não foi possível carregar os posts.", 
          variant: "destructive" 
        });
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [token, navigate]);

  const createNewPost = async () => {
    if (!token) {
      console.error('Token não encontrado');
      navigate('/login');
      return;
    }

    if (!newPostContent.trim() && !showEventForm) {
      toast({
        title: "Conteúdo vazio",
        description: "Adicione um texto ou um evento para publicar.",
        variant: "destructive"
      });
      return;
    }

    if (showEventForm && (!eventTitle.trim() || !eventLocation.trim() || !eventDate)) {
      toast({
        title: "Detalhes do evento incompletos",
        description: "Preencha todos os campos do evento.",
        variant: "destructive"
      });
      return;
    }

    try {
      const files = selectedVideo ? [selectedVideo] : selectedImages;
      const eventData = showEventForm && eventDate ? {
        title: eventTitle,
        date: format(eventDate, "d 'de' MMMM, yyyy", { locale: ptBR }),
        location: eventLocation
      } : undefined;

      const newPost = await createNewPostApi(newPostContent, files, eventData);
      setPosts(prevPosts => [newPost, ...prevPosts]);

      toast({ 
        title: "Publicação criada", 
        description: "Sua publicação foi compartilhada com sucesso!" 
      });

      setNewPostContent("");
      setSelectedImages([]);
      setPreviewImages([]);
      setSelectedVideo(null);
      setPreviewVideo(null);
      setShowEventForm(false);
      setEventTitle("");
      setEventLocation("");
      setEventDate(undefined);
      setNewPostDialog(false);
    } catch (error) {
      console.error('Erro ao enviar post:', error);
      toast({ 
        title: "Erro", 
        description: error instanceof Error ? error.message : "Não foi possível criar a publicação.",
        variant: "destructive" 
      });
    }
  };

  const handleLike = async (postId: string) => {
    if (!token) {
      console.error('Token não encontrado');
      navigate('/login');
      return;
    }

    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost) return;

    const wasLiked = targetPost.liked;

    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          liked: !post.liked,
          likes: post.liked ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    }));

    try {
      const updatedLikes = await toggleLikePost(postId);
      const userId = localStorage.getItem('userId');
      const isNowLiked = updatedLikes.some(id => id === userId || id.toString() === userId);

      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            liked: isNowLiked,
            likes: updatedLikes.length
          };
        }
        return post;
      }));
    } catch (error) {
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            liked: wasLiked,
            likes: wasLiked ? post.likes + 1 : post.likes - 1
          };
        }
        return post;
      }));

      toast({ 
        title: "Erro", 
        description: "Não foi possível curtir a publicação.",
        variant: "destructive" 
      });
    }
  };

  const handleComment = async (postId: string) => {
    if (!token) {
      console.error('Token não encontrado');
      navigate('/login');
      return;
    }

    if (!commentInput[postId]?.trim()) return;

    const commentText = commentInput[postId];
    setCommentInput(prev => ({ ...prev, [postId]: '' }));

    const tempId = `temp-${Date.now()}`;
    const tempComment = {
      id: tempId,
      user: { name: 'Você', initials: 'VC' },
      content: commentText,
      timestamp: 'agora'
    };

    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === postId) {
        return { ...post, comments: [...post.comments, tempComment] };
      }
      return post;
    }));

    try {
      const updatedComments = await addComment(postId, commentText);
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          return { ...post, comments: updatedComments };
        }
        return post;
      }));
    } catch (error) {
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          return { ...post, comments: post.comments.filter(c => c.id !== tempId) };
        }
        return post;
      }));

      toast({ 
        title: "Erro", 
        description: "Não foi possível adicionar o comentário.",
        variant: "destructive" 
      });
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newImages = filesArray.slice(0, 4);
      setSelectedImages(prevImages => [...prevImages, ...newImages].slice(0, 4));
      const newPreviewUrls = newImages.map(file => URL.createObjectURL(file));
      setPreviewImages(prevPreviewUrls => [...prevPreviewUrls, ...newPreviewUrls].slice(0, 4));
      if (e.target.value) e.target.value = '';
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImages([]);
      setPreviewImages([]);
      const file = e.target.files[0];
      setSelectedVideo(file);
      setPreviewVideo(URL.createObjectURL(file));
      if (e.target.value) e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newSelectedImages = [...selectedImages];
    const newPreviewImages = [...previewImages];
    URL.revokeObjectURL(newPreviewImages[index]);
    newSelectedImages.splice(index, 1);
    newPreviewImages.splice(index, 1);
    setSelectedImages(newSelectedImages);
    setPreviewImages(newPreviewImages);
  };

  const removeVideo = () => {
    if (previewVideo) {
      URL.revokeObjectURL(previewVideo);
    }
    setSelectedVideo(null);
    setPreviewVideo(null);
  };

  const toggleEventForm = () => {
    setShowEventForm(!showEventForm);
    if (!showEventForm) {
      setEventTitle("");
      setEventLocation("");
      setEventDate(undefined);
    }
  };

  const filteredPosts = activeTab === "todos" 
    ? posts 
    : activeTab === "fotos" 
      ? posts.filter(post => post.images && post.images.length > 0)
      : activeTab === "videos"
        ? posts.filter(post => post.video)
        : posts.filter(post => post.event);

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Timeline</h1>
            <p className="text-muted-foreground">Compartilhe e acompanhe eventos da empresa</p>
          </div>
          
          <Dialog open={newPostDialog} onOpenChange={setNewPostDialog}>
            <DialogTrigger asChild>
              <Button className="bg-[#e60909] hover:bg-[#e60909]/90 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Nova Publicação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Criar Nova Publicação</DialogTitle>
                <DialogDescription>
                  Compartilhe novidades, eventos ou atualizações com a equipe.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-start space-x-3">
                  <Avatar>
                    <AvatarFallback className="bg-[#e60909] text-white">
                      VC
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">Você</p>
                    <Textarea 
                      placeholder="O que você deseja compartilhar?" 
                      className="mt-2 focus-visible:ring-[#e60909] resize-none"
                      rows={4}
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                    />
                  </div>
                </div>

                {previewImages.length > 0 && (
                  <div className={cn(
                    "grid gap-2 mt-4", 
                    previewImages.length > 1 ? "grid-cols-2" : "grid-cols-1"
                  )}>
                    {previewImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-video overflow-hidden rounded-lg">
                        <img 
                          src={img} 
                          alt={`Imagem ${idx + 1}`} 
                          className="object-cover w-full h-full"
                        />
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          className="absolute top-1 right-1 h-6 w-6 rounded-full"
                          onClick={() => removeImage(idx)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {previewVideo && (
                  <div className="mt-4 rounded-lg overflow-hidden relative">
                    <video controls className="w-full">
                      <source src={previewVideo} type="video/mp4" />
                      Seu navegador não suporta a reprodução de vídeos.
                    </video>
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-1 right-1 h-6 w-6 rounded-full"
                      onClick={removeVideo}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                {showEventForm && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4 mt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-[#e60909] flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> 
                        Detalhes do Evento
                      </h3>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={toggleEventForm}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="event-title">Título do evento</Label>
                        <Input
                          id="event-title"
                          placeholder="Ex: Reunião de Equipe"
                          value={eventTitle}
                          onChange={(e) => setEventTitle(e.target.value)}
                        />
                      </div>
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="event-location">Local</Label>
                        <Input
                          id="event-location"
                          placeholder="Ex: Sala de Reuniões, Loja Centro"
                          value={eventLocation}
                          onChange={(e) => setEventLocation(e.target.value)}
                        />
                      </div>
                      <div className="grid w-full items-center gap-1.5">
                        <Label>Data</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !eventDate && "text-muted-foreground"
                              )}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {eventDate ? (
                                format(eventDate, "PPP", { locale: ptBR })
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={eventDate}
                              onSelect={setEventDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <input 
                    type="file" 
                    ref={imageInputRef}
                    accept="image/*" 
                    multiple 
                    className="hidden" 
                    onChange={handleImageSelect}
                    disabled={!!selectedVideo || previewImages.length >= 4}
                  />
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={!!selectedVideo || previewImages.length >= 4}
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    {previewImages.length > 0 ? 
                      `Fotos (${previewImages.length}/4)` : 
                      "Adicionar Fotos"
                    }
                  </Button>
                  <input 
                    type="file" 
                    ref={videoInputRef}
                    accept="video/*" 
                    className="hidden" 
                    onChange={handleVideoSelect}
                    disabled={previewImages.length > 0}
                  />
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={previewImages.length > 0 || !!selectedVideo}
                  >
                    <Film className="mr-2 h-4 w-4" />
                    {selectedVideo ? "Vídeo Selecionado" : "Adicionar Vídeo"}
                  </Button>
                  <Button 
                    variant="outline" 
                    className={cn(
                      "flex-1",
                      showEventForm && "bg-gray-100 dark:bg-gray-700"
                    )}
                    onClick={toggleEventForm}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {showEventForm ? "Cancelar Evento" : "Criar Evento"}
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setNewPostContent("");
                    setSelectedImages([]);
                    setPreviewImages([]);
                    setSelectedVideo(null);
                    setPreviewVideo(null);
                    setShowEventForm(false);
                    setEventTitle("");
                    setEventLocation("");
                    setEventDate(undefined);
                    setNewPostDialog(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  className="bg-[#e60909] hover:bg-[#e60909]/90 text-white"
                  onClick={createNewPost}
                >
                  Publicar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        <Tabs defaultValue="todos" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="fotos">Fotos</TabsTrigger>
            <TabsTrigger value="videos">Vídeos</TabsTrigger>
            <TabsTrigger value="eventos">Eventos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="todos" className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <p>Carregando publicações...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">
                <p>{error}</p>
                <Button 
                  className="mt-4 bg-[#e60909] hover:bg-[#e60909]/90 text-white"
                  onClick={() => window.location.reload()}
                >
                  Tentar novamente
                </Button>
              </div>
            ) : filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <Card key={post.id} className="animate-fade-in">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex space-x-3">
                        <Avatar>
                          <AvatarImage src={post.user.avatar} />
                          <AvatarFallback className="bg-[#e60909] text-white">
                            {post.user.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{post.user.name}</CardTitle>
                          <CardDescription>{post.timestamp}</CardDescription>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>Salvar</DropdownMenuItem>
                          <DropdownMenuItem>Reportar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="mb-4 whitespace-pre-line">{post.content}</p>
                    {post.event && (
                      <div className="bg-[#e60909]/10 rounded-lg p-3 mb-4">
                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 text-[#e60909] mr-2" />
                          <h4 className="font-medium text-[#e60909]">{post.event.title}</h4>
                        </div>
                        <div className="text-sm ml-7 space-y-1 mt-1">
                          <p className="text-gray-600">{post.event.date}</p>
                          <p className="text-gray-600">{post.event.location}</p>
                        </div>
                      </div>
                    )}
                    {post.images && post.images.length > 0 && (
                      <div className={cn(
                        "grid gap-2 mb-4", 
                        post.images.length > 1 ? "grid-cols-2" : "grid-cols-1"
                      )}>
                        {post.images.map((img, idx) => (
                          <div key={idx} className="relative aspect-video overflow-hidden rounded-lg">
                            <ImageRenderer 
                              src={img} 
                              alt={`Imagem ${idx + 1}`} 
                              className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    {post.video && (
                      <div className="mb-4 rounded-lg overflow-hidden">
                        <video 
                          controls 
                          className="w-full" 
                          poster="https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7"
                        >
                          <source src={post.video} type="video/mp4" />
                          Seu navegador não suporta a reprodução de vídeos.
                        </video>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm text-gray-500 pt-2 border-t">
                      <div>{post.likes} curtidas</div>
                      <div>{post.comments.length} comentários</div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-4">
                    <div className="flex justify-around w-full border-y py-1">
                      <Button 
                        variant="ghost" 
                        className={cn(
                          "flex-1", 
                          post.liked ? "text-[#e60909]" : ""
                        )}
                        onClick={() => handleLike(post.id)}
                      >
                        <Heart className={cn("mr-1 h-4 w-4", post.liked ? "fill-[#e60909]" : "")} />
                        Curtir
                      </Button>
                      <Button variant="ghost" className="flex-1">
                        <MessageCircle className="mr-1 h-4 w-4" />
                        Comentar
                      </Button>
                    </div>
                    {post.comments.length > 0 && (
                      <div className="space-y-3 w-full">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="flex space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={comment.user.avatar} />
                              <AvatarFallback className="bg-[#e60909] text-white text-xs">
                                {comment.user.initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2 px-3">
                                <div className="font-medium text-sm">{comment.user.name}</div>
                                <div className="text-sm">{comment.content}</div>
                              </div>
                              <div className="flex text-xs text-gray-500 mt-1 ml-2 space-x-3">
                                <span>{comment.timestamp}</span>
                                <button className="hover:text-[#e60909]">Curtir</button>
                                <button className="hover:text-[#e60909]">Responder</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex space-x-3 w-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-[#e60909] text-white text-xs">
                          VC
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 flex">
                        <Input 
                          placeholder="Escreva um comentário..." 
                          className="rounded-r-none focus-visible:ring-0 border-r-0"
                          value={commentInput[post.id] || ''}
                          onChange={(e) => setCommentInput({
                            ...commentInput,
                            [post.id]: e.target.value
                          })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleComment(post.id);
                            }
                          }}
                        />
                        <Button 
                          className="rounded-l-none bg-[#e60909] hover:bg-[#e60909]/90 text-white"
                          onClick={() => handleComment(post.id)}
                          disabled={!commentInput[post.id]?.trim()}
                        >
                          Enviar
                        </Button>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-4 inline-block">
                  {activeTab === "fotos" ? (
                    <ImageIcon className="h-10 w-10 text-gray-400" />
                  ) : activeTab === "videos" ? (
                    <Film className="h-10 w-10 text-gray-400" />
                  ) : activeTab === "eventos" ? (
                    <Calendar className="h-10 w-10 text-gray-400" />
                  ) : (
                    <MessageCircle className="h-10 w-10 text-gray-400" />
                  )}
                </div>
                <h3 className="text-lg font-medium mt-4">Nenhuma publicação encontrada</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {activeTab === "fotos" 
                    ? "Ainda não há fotos compartilhadas" 
                    : activeTab === "videos"
                      ? "Ainda não há vídeos compartilhados"
                      : activeTab === "eventos"
                        ? "Ainda não há eventos compartilhados"
                        : "Comece compartilhando algo com sua equipe"}
                </p>
                <Button 
                  className="mt-4 bg-[#e60909] hover:bg-[#e60909]/90 text-white"
                  onClick={() => setNewPostDialog(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Publicação
                </Button>
              </div>
            )}
          </TabsContent>
          <TabsContent value="fotos" className="space-y-6" />
          <TabsContent value="videos" className="space-y-6" />
          <TabsContent value="eventos" className="space-y-6" />
        </Tabs>
      </div>
    </Layout>
  );
};

export default Timeline;