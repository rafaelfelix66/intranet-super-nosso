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

const samplePosts: Post[] = [
  {
    id: '1',
    user: { name: 'Marketing Super Nosso', initials: 'MK' },
    content: 'A inauguração da nossa nova loja foi um sucesso! Agradecemos a todos que participaram deste momento especial.',
    images: [
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c',
      'https://images.unsplash.com/photo-1605810230434-7631ac76ec81'
    ],
    timestamp: '2 horas atrás',
    likes: 24,
    comments: [
      {
        id: 'c1',
        user: { name: 'Ana Silva', initials: 'AS' },
        content: 'Parabéns pela iniciativa! A loja ficou incrível.',
        timestamp: '1 hora atrás'
      },
      {
        id: 'c2',
        user: { name: 'Carlos Oliveira', initials: 'CO' },
        content: 'Muito bom! Quando será a próxima inauguração?',
        timestamp: '30 minutos atrás'
      }
    ],
    liked: false,
    event: {
      title: 'Inauguração Loja Pampulha',
      date: '10 de Junho, 2023',
      location: 'Av. Presidente Carlos Luz, 3001 - Pampulha'
    }
  },
  {
    id: '2',
    user: { name: 'Recursos Humanos', initials: 'RH' },
    content: 'Convidamos todos os funcionários para o treinamento anual de capacitação que ocorrerá no próximo mês. Será uma oportunidade para aprimorar habilidades e conhecer novas técnicas.',
    timestamp: '1 dia atrás',
    likes: 15,
    comments: [
      {
        id: 'c3',
        user: { name: 'Mariana Costa', initials: 'MC' },
        content: 'Estou ansiosa para participar!',
        timestamp: '20 horas atrás'
      }
    ],
    liked: true,
    event: {
      title: 'Treinamento Anual de Capacitação',
      date: '15 de Julho, 2023',
      location: 'Centro de Treinamento - Unidade Centro'
    }
  },
  {
    id: '3',
    user: { name: 'Operações', initials: 'OP' },
    content: 'Assista ao vídeo sobre os novos procedimentos de estoque que implementamos este mês:',
    video: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
    timestamp: '3 dias atrás',
    likes: 32,
    comments: [],
    liked: false
  }
];

const Timeline = () => {
  const [posts, setPosts] = useState<Post[]>(samplePosts); // Inicialmente com dados locais
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
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token'); // Supondo que o token está salvo

  // Carregar posts do backend ao montar o componente
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch('http://127.0.0.1:3000/api/timeline', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setPosts(data); // Substitui os dados locais pelos do backend
      } catch (error) {
        console.error('Erro ao carregar posts:', error);
        toast({ title: "Erro", description: "Não foi possível carregar os posts.", variant: "destructive" });
      }
    };
    fetchPosts();
  }, [token]);

  // Criar novo post com envio ao backend
  const createNewPost = async () => {
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
    
    const formData = new FormData();
    formData.append('text', newPostContent);
    selectedImages.forEach((image, index) => formData.append(`attachments`, image));
    if (selectedVideo) formData.append('attachments', selectedVideo);

    const eventDetails = showEventForm && eventDate ? {
      title: eventTitle,
      date: format(eventDate, "d 'de' MMMM, yyyy", { locale: ptBR }),
      location: eventLocation
    } : undefined;

    console.log('Enviando post para:', 'http://127.0.0.1:3000/api/timeline', { text: newPostContent, event: eventDetails, images: selectedImages.length, video: !!selectedVideo });
    try {
      const response = await fetch('http://127.0.0.1:3000/api/timeline', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      console.log('Resposta do servidor:', data);
      setPosts([data, ...posts]); // Adiciona o novo post retornado pelo backend
      toast({ title: "Publicação criada", description: "Sua publicação foi compartilhada com sucesso!" });
    } catch (error) {
      console.error('Erro ao enviar post:', error);
      toast({ title: "Erro", description: "Não foi possível criar a publicação.", variant: "destructive" });
    }
    
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
  };
  
  const handleLike = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        const liked = !post.liked;
        return {
          ...post,
          liked,
          likes: liked ? post.likes + 1 : post.likes - 1
        };
      }
      return post;
    }));
    // TODO: Enviar ao backend (PUT /api/timeline/:id/like)
  };
  
  const handleComment = (postId: string) => {
    if (!commentInput[postId]?.trim()) return;
    
    const newComment: PostComment = {
      id: `c${Date.now()}`,
      user: { name: 'Você', initials: 'VC' },
      content: commentInput[postId],
      timestamp: 'agora'
    };
    
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [...post.comments, newComment]
        };
      }
      return post;
    }));
    
    setCommentInput({
      ...commentInput,
      [postId]: ''
    });
    // TODO: Enviar ao backend (POST /api/timeline/:id/comment)
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
            {filteredPosts.map((post) => (
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
            ))}
            
            {filteredPosts.length === 0 && (
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