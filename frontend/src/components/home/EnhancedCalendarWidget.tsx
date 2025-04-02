// src/components/home/EnhancedCalendarWidget.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ChevronLeft, ChevronRight, Plus, Loader2, MapPin } from "lucide-react";
import { api } from "@/lib/api"; 
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Interface para eventos do calendário
interface Event {
  id: string;
  title: string;
  date: Date;
  location: string;
  description?: string;
  postId?: string;    // ID do post na timeline
  createdAt?: string; // Data de criação
}

export function EnhancedCalendarWidget() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [multiEventView, setMultiEventView] = useState(false);
  
  // Estados do formulário
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const MONTHS = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  
  // Função para buscar eventos da timeline no servidor
  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      console.log("EnhancedCalendarWidget: Buscando posts da timeline...");
      // Fazendo a chamada ao backend para buscar os eventos
      const response = await api.get('/timeline');
      
      if (Array.isArray(response)) {
        console.log(`EnhancedCalendarWidget: Recebidos ${response.length} posts`);
        
        // Processar TODOS os posts, extraindo eventos quando existirem
        const timelineEvents = response
          .map(post => {
            // Primeiro, verificar se tem eventData
            if (post.eventData) {
              let eventData = post.eventData;
              
              // Converter a data formatada (ex: "15 de março, 2023") para objeto Date
              let eventDate;
              try {
                const dateRegex = /(\d+)\s+de\s+(\w+),\s+(\d{4})/;
                const match = eventData.date.match(dateRegex);
                
                if (match) {
                  const [_, day, monthName, year] = match;
                  const monthIndex = getMonthIndex(monthName);
                  
                  if (monthIndex !== -1) {
                    eventDate = new Date(parseInt(year), monthIndex, parseInt(day));
                  } else {
                    eventDate = new Date(); // Fallback para data atual
                  }
                } else {
                  // Tentar parse direto
                  eventDate = new Date(eventData.date);
                }
                
                return {
                  id: post._id + "-event", 
                  title: eventData.title,
                  date: eventDate,
                  location: eventData.location || '',
                  description: post.text || '',
                  postId: post._id,
                  createdAt: post.createdAt
                };
              } catch (e) {
                console.error('Erro ao converter data do evento:', e);
                return null;
              }
            }
            
            // Verificar se o conteúdo do post contém um padrão de evento
            // Formato: Título: [título], Data: [data], Local: [local]
            if (post.text && typeof post.text === 'string') {
              const eventPattern = /Título:\s*([^,\n]+)(?:,|\n)?\s*Data:\s*([^,\n]+)(?:,|\n)?\s*Local:\s*([^,\n]+)/i;
              const match = post.text.match(eventPattern);
              
              if (match) {
                const [_, eventTitle, eventDateText, eventLocation] = match;
                
                // Tentar converter a data
                let eventDate;
                try {
                  // Verificar se é um formato conhecido
                  const dateRegex = /(\d+)\s+de\s+(\w+),\s+(\d{4})/;
                  const dateMatch = eventDateText.match(dateRegex);
                  
                  if (dateMatch) {
                    const [_, day, monthName, year] = dateMatch;
                    const monthIndex = getMonthIndex(monthName);
                    
                    if (monthIndex !== -1) {
                      eventDate = new Date(parseInt(year), monthIndex, parseInt(day));
                    } else {
                      eventDate = new Date(eventDateText);
                    }
                  } else {
                    eventDate = new Date(eventDateText);
                  }
                  
                  return {
                    id: post._id + "-parsed-event",
                    title: eventTitle.trim(),
                    date: eventDate,
                    location: eventLocation.trim(),
                    description: post.text || '',
                    postId: post._id,
                    createdAt: post.createdAt
                  };
                } catch (e) {
                  console.error('Erro ao converter data do evento em texto:', e);
                  return null;
                }
              }
            }
            
            return null; // Post sem evento
          })
          .filter(event => event !== null) as Event[];
        
        // Ordenar eventos por data (mais recentes primeiro)
        timelineEvents.sort((a, b) => b.date.getTime() - a.date.getTime());
        
        setEvents(timelineEvents);
        console.log('Eventos carregados da timeline:', timelineEvents);
      }
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os eventos",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função auxiliar para obter índice do mês a partir do nome
  const getMonthIndex = (monthName: string): number => {
    const months = {
      'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3,
      'maio': 4, 'junho': 5, 'julho': 6, 'agosto': 7,
      'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
    };
    
    return months[monthName.toLowerCase()] || -1;
  };
  
  // Carrega eventos ao montar o componente e ao mudar de mês
  useEffect(() => {
    fetchEvents();
  }, []);
  
  // Formatador de data para exibição
  const formatEventDate = (date: Date): string => {
    return format(date, "d 'de' MMMM, yyyy", { locale: ptBR });
  };
  
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };
  
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  const handleDateClick = (day: number) => {
    const newSelectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newSelectedDate);
    
    // Verificar quantos eventos existem para essa data
    const eventsForDay = events.filter(event => {
      if (!event.date) return false;
      return event.date.getDate() === day && 
        event.date.getMonth() === currentDate.getMonth() && 
        event.date.getFullYear() === currentDate.getFullYear();
    });
    
    // Se houver mais de um evento, mostrar a visão multi-evento
    if (eventsForDay.length > 1) {
      setMultiEventView(true);
    } else {
      setMultiEventView(false);
    }
  };
  
  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
    
    const days = [];
    
    // Add empty cells for days before first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }
    
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isSelected = selectedDate.getDate() === day && 
                       selectedDate.getMonth() === currentDate.getMonth() && 
                       selectedDate.getFullYear() === currentDate.getFullYear();
      const isToday = new Date().getDate() === day && 
                     new Date().getMonth() === currentDate.getMonth() && 
                     new Date().getFullYear() === currentDate.getFullYear();
      
      // Check if day has events and count them
      const dayEvents = events.filter(event => {
        if (!event.date) return false;
        return event.date.getDate() === day && 
               event.date.getMonth() === currentDate.getMonth() && 
               event.date.getFullYear() === currentDate.getFullYear();
      });
      
      const hasEvents = dayEvents.length > 0;
      const multipleEvents = dayEvents.length > 1;
      
      days.push(
        <button
          key={day}
          className={`h-8 w-8 rounded-full flex items-center justify-center relative ${
            isSelected 
              ? "bg-supernosso-red text-white" 
              : isToday 
                ? "border border-supernosso-red text-supernosso-darkgray" 
                : "hover:bg-supernosso-light-red text-supernosso-darkgray"
          }`}
          onClick={() => handleDateClick(day)}
        >
          {day}
          {hasEvents && !isSelected && (
            <span 
              className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 ${
                multipleEvents ? "w-3 h-1 rounded-md" : "w-1 h-1 rounded-full"
              } bg-supernosso-red`} 
            />
          )}
        </button>
      );
    }
    
    return days;
  };
  
  const getEventsForSelectedDate = () => {
    return events.filter(event => {
      if (!event.date) return false;
      return event.date.getDate() === selectedDate.getDate() && 
        event.date.getMonth() === selectedDate.getMonth() && 
        event.date.getFullYear() === selectedDate.getFullYear();
    });
  };
  
  const selectedEvents = getEventsForSelectedDate();
  
  // Reset do formulário
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLocation("");
    setDate(selectedDate);
  };
  
  // Abrir formulário de evento
  const openEventForm = () => {
    resetForm();
    setDate(selectedDate);
    setIsEventFormOpen(true);
  };
  
  // Criar novo evento - agora garantindo que seja salvo no banco
  const handleCreateEvent = async () => {
    if (!title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, informe um título para o evento.",
        variant: "destructive"
      });
      return;
    }
    
    if (!date) {
      toast({
        title: "Data obrigatória",
        description: "Por favor, selecione uma data para o evento.",
        variant: "destructive"
      });
      return;
    }
    
    if (!location.trim()) {
      toast({
        title: "Local obrigatório",
        description: "Por favor, informe o local do evento.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Preparar dados do evento
      const eventData = {
        title: title.trim(),
        date: formatEventDate(date),
        location: location.trim()
      };
      
      console.log("Enviando evento para o banco de dados:", eventData);
      
      // Verificando se api tem método post
      if (typeof api.post !== 'function') {
        console.error("Método api.post não está disponível");
        throw new Error("Método api.post não está disponível");
      }
      
      // Criar post com evento - isso salva no banco de dados
      const postData = {
        text: description || '',
        eventData: eventData
      };
      
      // Enviar para a API e salvar no banco de dados
      const response = await api.post('/timeline', postData);
      console.log("Resposta da criação do evento:", response);
      
      toast({
        title: "Evento criado",
        description: "Seu evento foi salvo no banco de dados com sucesso."
      });
      
      // Recarregar os eventos para mostrar o novo evento do banco
      fetchEvents();
      
      // Fechar o formulário
      setIsEventFormOpen(false);
    } catch (error) {
      console.error("Erro ao criar evento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o evento no banco de dados. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Ver detalhes do evento na timeline
  const viewEventInTimeline = (postId: string) => {
    window.location.href = `/timeline?post=${postId}`;
  };
  
  // Forçar atualização dos eventos do banco de dados
  const refreshEvents = () => {
    fetchEvents();
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Calendário</CardTitle>
          <div className="flex space-x-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={refreshEvents} 
              title="Atualizar eventos do banco de dados"
            >
              <Loader2 className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="text-center font-medium">
          {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {DAYS.map(day => (
            <div key={day} className="text-xs font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 justify-items-center">
          {renderCalendarDays()}
        </div>
      </CardContent>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="font-medium text-sm border-b pb-2 flex items-center justify-between">
            <div className="flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4 text-supernosso-red" />
              <span>Eventos para {selectedDate.getDate()} de {MONTHS[selectedDate.getMonth()]}</span>
            </div>
            {multiEventView && selectedEvents.length > 1 && (
              <Badge variant="outline" className="text-xs">
                {selectedEvents.length} eventos
              </Badge>
            )}
          </div>
          {isLoading ? (
            <div className="py-2 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : selectedEvents.length > 0 ? (
            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
              {selectedEvents.map(event => (
                <div 
                  key={event.id} 
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => event.postId && viewEventInTimeline(event.postId)}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-supernosso-red">{event.title}</h4>
                      <Badge variant="outline" className="text-xs bg-supernosso-light-red text-supernosso-red border-none">
                        Evento
                      </Badge>
                    </div>
                    
                    <div className="flex items-center text-xs text-gray-500">
                      <MapPin className="h-3 w-3 mr-1" />
                      {event.location}
                    </div>
                    
                    {event.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    
                    <div className="flex justify-end">
                      <Link to={`/timeline?post=${event.postId}`} className="text-xs text-supernosso-red hover:underline">
                        Ver na timeline
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 py-2 text-center">
              Nenhum evento para esta data
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button 
          variant="outline" 
          className="w-full text-supernosso-red hover:text-supernosso-red hover:border-supernosso-red"
          onClick={openEventForm}
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Evento
        </Button>
      </CardFooter>
      
      {/* Formulário de Evento Integrado */}
      <Dialog open={isEventFormOpen} onOpenChange={setIsEventFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Novo Evento</DialogTitle>
            <DialogDescription>
              Preencha os detalhes para criar um novo evento
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="event-title">Título <span className="text-red-500">*</span></Label>
              <Input
                id="event-title"
                placeholder="Ex: Reunião de Equipe"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="event-date">Data <span className="text-red-500">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? (
                      format(date, "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="event-location">Local <span className="text-red-500">*</span></Label>
              <Input
                id="event-location"
                placeholder="Ex: Sala de Reuniões, Loja Centro"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="event-description">Descrição (opcional)</Label>
              <Textarea
                id="event-description"
                placeholder="Detalhes adicionais sobre o evento"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEventFormOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateEvent} 
              disabled={isSubmitting}
              className="bg-supernosso-red hover:bg-supernosso-red/90 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Criar Evento"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default EnhancedCalendarWidget;