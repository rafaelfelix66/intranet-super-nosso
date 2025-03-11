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

// Criamos dados iniciais vazios em vez de usar samplePosts
const initialPosts: Post[] = [];

const API_URL = "http://127.0.0.1:3000/api";

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

  // Carregar posts do backend ao montar o componente
  useEffect(() => {
    const fetchPosts = async () => {
      if (!token) {
        console.error('Token não encontrado');
        navigate('/login');
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        console.log('Tentando buscar posts do backend...');
        
        // Use explicitamente a URL completa em vez de depender da variável API_URL
        const response = await fetch('http://127.0.0.1:3000/api/timeline', {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        
        console.log('Status da resposta:', response.status);
        
        if (!response.ok) {
          throw new Error(`Erro ao carregar posts: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Posts recebidos do backend:', data);
        
        if (Array.isArray(data)) {
          // Garantir que o ID do usuário esteja sendo armazenado corretamente e usado para verificar curtidas
          const userId = localStorage.getItem('userId');
          console.log("ID do usuário atual:", userId);
          
          // Converter para o formato do frontend
          const formattedPosts: Post[] = data.map(post => {
            // Adicionar log para cada post para depuração
            console.log(`Post ${post._id} - curtidas:`, post.likes);
            
            return {
              id: post._id,
              user: {
                name: post.user?.nome || 'Usuário',
                initials: getInitials(post.user?.nome || 'Usuário')
              },
              content: post.text,
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
              ) || false
            };
          });
          
          // Processar anexos
          formattedPosts.forEach(post => {
            const postData = data.find(p => p._id === post.id);
            if (postData?.attachments && postData.attachments.length > 0) {
              // Imagens
              const imageAttachments = postData.attachments.filter(att => 
                att.contentType && att.contentType.startsWith('image/'));
              if (imageAttachments.length > 0) {
                post.images = imageAttachments.map(img => img.type);
              }
              
              // Vídeos
              const videoAttachment = postData.attachments.find(att => 
                att.contentType && att.contentType.startsWith('video/'));
              if (videoAttachment) {
                post.video = videoAttachment.type;
              }
            }
            
            // Evento
            if (postData.eventData) {
              try {
                post.event = typeof postData.eventData === 'string' 
                  ? JSON.parse(postData.eventData)
                  : postData.eventData;
              } catch (e) {
                console.error('Erro ao processar dados do evento:', e);
              }
            }
          });
          
          setPosts(formattedPosts);
          console.log('Posts formatados:', formattedPosts);
        } else {
          console.error('Resposta do backend não é um array:', data);
          setPosts([]);
        }
      } catch (error) {
        console.error('Erro ao carregar posts:', error);
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
    
    fetchPosts();
  }, [token, navigate]);
  
  // Formatar timestamp para exibição
  const formatTimestamp = (date: string | Date) => {
    if (!date) return 'algum momento';
    
    const now = new Date();
    const postDate = new Date(date);
    const diff = Math.floor((now.getTime() - postDate.getTime()) / 1000); // diferença em segundos
    
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
      // Formatar data completa para posts mais antigos
      return new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  };

  // Criar novo post com envio ao backend
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
      // Criar FormData para envio de arquivos
      const formData = new FormData();
      formData.append('text', newPostContent);
      
      // Adicionar arquivos se existirem
      selectedImages.forEach(image => {
        formData.append('attachments', image);
      });
      
      if (selectedVideo) {
        formData.append('attachments', selectedVideo);
      }
      
      // Adicionar dados do evento se existirem
      if (showEventForm && eventDate) {
        const eventData = {
          title: eventTitle,
          date: format(eventDate, "d 'de' MMMM, yyyy", { locale: ptBR }),
          location: eventLocation
        };
        formData.append('eventData', JSON.stringify(eventData));
      }
      
      console.log('Tentando enviar post para o backend:', `${API_URL}/timeline`);
      
      // IMPORTANTE: Garantir que a chamada ao backend seja realmente executada
      // e não substituída por lógica local
      const response = await fetch('http://127.0.0.1:3000/api/timeline', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
          // Não definir Content-Type aqui, FormData define automaticamente
        },
        body: formData
      });
      
      console.log('Status da resposta:', response.status);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { mensagem: `Erro ${response.status}` };
        }
        console.error('Erro da resposta:', errorData);
        throw new Error(errorData.mensagem || `Erro ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Resposta do servidor após criar post:', data);
      
      // Formatando o post recebido para o formato usado no frontend
      const newPost: Post = {
        id: data._id,
        user: {
          name: data.user?.nome || 'Você',
          initials: data.user?.nome ? getInitials(data.user.nome) : 'VC'
        },
        content: data.text,
        timestamp: 'agora',
        likes: data.likes?.length || 0,
        comments: [],
        liked: false
      };
      
      // Adicionar o novo post à lista
      setPosts(prevPosts => [newPost, ...prevPosts]);
      
      toast({ 
        title: "Publicação criada", 
        description: "Sua publicação foi compartilhada com sucesso!" 
      });
      
      // Resetar formulário
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
        description: typeof error === 'object' && error instanceof Error ? error.message : "Não foi possível criar a publicação.",
        variant: "destructive" 
      });
    }
  };
  
  // Função auxiliar para obter iniciais de um nome
  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Implementar curtida de post com envio ao backend
  const handleLike = async (postId: string) => {
    if (!token) {
      console.error('Token não encontrado');
      navigate('/login');
      return;
    }
    
    // Obter o estado atual de curtida do post
    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost) return;
    
    const wasLiked = targetPost.liked;
    console.log(`Curtindo post ${postId}, estado anterior: ${wasLiked ? 'curtido' : 'não curtido'}`);
    
    // Atualizar UI otimisticamente
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
      // Chamar API
      const response = await fetch(`http://127.0.0.1:3000/api/timeline/${postId}/like`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao curtir post: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Resposta de curtida:', data);
      
      // Verificar se o usuário atual está na lista de curtidas após a operação
      const userId = localStorage.getItem('userId');
      const isNowLiked = data.some(id => id === userId || id.toString() === userId);
      
      // Atualizar com os dados reais do servidor
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            liked: isNowLiked,
            likes: data.length // número real de curtidas
          };
        }
        return post;
      }));
      
    } catch (error) {
      console.error('Erro ao curtir post:', error);
      
      // Reverter a UI em caso de erro
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
  
  // Implementar adição de comentário com envio ao backend
  const handleComment = async (postId: string) => {
    if (!token) {
      console.error('Token não encontrado');
      navigate('/login');
      return;
    }
    
    if (!commentInput[postId]?.trim()) return;
    
    const commentText = commentInput[postId];
    
    // Limpar input imediatamente para melhor UX
    setCommentInput(prev => ({
      ...prev,
      [postId]: ''
    }));
    
    // Criar um comentário temporário para atualização otimista da UI
    const tempId = `temp-${Date.now()}`;
    const tempComment = {
      id: tempId,
      user: {
        name: 'Você',
        initials: 'VC'
      },
      content: commentText,
      timestamp: 'agora'
    };
    
    // Atualizar UI otimisticamente
    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [...post.comments, tempComment]
        };
      }
      return post;
    }));
    
    try {
      console.log('Enviando comentário para o backend:', { postId, text: commentText });
      
      // Chamada explícita ao backend
      const response = await fetch(`http://127.0.0.1:3000/api/timeline/${postId}/comment`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: commentText })
      });
      
      console.log('Status da resposta de comentário:', response.status);
      
      if (!response.ok) {
        // Reverter UI em caso de erro
        setPosts(prevPosts => prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: post.comments.filter(c => c.id !== tempId)
            };
          }
          return post;
        }));
        
        throw new Error(`Erro ao adicionar comentário: ${response.status}`);
      }
      
      const updatedPost = await response.json();
      console.log('Post com novo comentário:', updatedPost);
      
      // Atualizar o post com os dados reais do backend
      if (updatedPost.comments) {
        setPosts(prevPosts => prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: updatedPost.comments.map((comment: any) => ({
                id: comment._id,
                user: {
                  name: comment.user?.nome || 'Usuário',
                  initials: getInitials(comment.user?.nome || 'Usuário')
                },
                content: comment.text,
                timestamp: formatTimestamp(comment.createdAt)
              }))
            };
          }
          return post;
        }));
      }
      
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
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
      
      // Limit to 4 images
      const newImages = filesArray.slice(0, 4);
      setSelectedImages(prevImages => [...prevImages, ...newImages].slice(0, 4));
      
      // Create preview URLs
      const newPreviewUrls = newImages.map(file => URL.createObjectURL(file));
      setPreviewImages(prevPreviewUrls => [...prevPreviewUrls, ...newPreviewUrls].slice(0, 4));
      
      // Clear the input to allow selecting the same file again
      if (e.target.value) e.target.value = '';
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // If a video is selected, clear any previously selected images
      setSelectedImages([]);
      setPreviewImages([]);
      
      const file = e.target.files[0];
      setSelectedVideo(file);
      setPreviewVideo(URL.createObjectURL(file));
      
      // Clear the input to allow selecting the same file again
      if (e.target.value) e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newSelectedImages = [...selectedImages];
    const newPreviewImages = [...previewImages];
    
    // Revoke the object URL to avoid memory leaks
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
      // Clear previous event details when opening the form
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

                {/* Preview dos arquivos selecionados */}
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
                    <video 
                      controls 
                      className="w-full" 
                    >
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

                {/* Formulário do evento */}
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

                {/* Botões para adicionar mídia */}
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
                            <img 
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
          
          <TabsContent value="fotos" className="space-y-6">
            {/* Conteúdo filtrado já renderizado na aba "todos" */}
          </TabsContent>
          
          <TabsContent value="videos" className="space-y-6">
            {/* Conteúdo filtrado já renderizado na aba "todos" */}
          </TabsContent>
          
          <TabsContent value="eventos" className="space-y-6">
            {/* Conteúdo filtrado já renderizado na aba "todos" */}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Timeline;					