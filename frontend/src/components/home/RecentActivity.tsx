
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileText, FileImage, MessageSquare, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Activity {
  id: string;
  type: 'file' | 'image' | 'comment';
  user: {
    name: string;
    avatar?: string;
    initials: string;
  };
  title: string;
  time: string;
  description?: string;
  link: string;
}

const activities: Activity[] = [
  {
    id: '1',
    type: 'file',
    user: { name: 'João Silva', initials: 'JS' },
    title: 'Relatório Mensal de Vendas',
    time: '1 hora atrás',
    description: 'Adicionou um novo documento na pasta Relatórios',
    link: '/arquivos'
  },
  {
    id: '2',
    type: 'image',
    user: { name: 'Maria Oliveira', initials: 'MO' },
    title: 'Inauguração da Nova Loja',
    time: '3 horas atrás',
    description: 'Adicionou 5 fotos ao evento',
    link: '/timeline'
  },
  {
    id: '3',
    type: 'comment',
    user: { name: 'Pedro Santos', initials: 'PS' },
    title: 'Comentou em um documento',
    time: '5 horas atrás',
    description: 'Excelente trabalho na apresentação!',
    link: '/arquivos'
  },
  {
    id: '4',
    type: 'file',
    user: { name: 'Ana Costa', initials: 'AC' },
    title: 'Guia de Treinamento',
    time: '1 dia atrás',
    description: 'Atualizou o manual de procedimentos',
    link: '/arquivos'
  },
  {
    id: '5',
    type: 'comment',
    user: { name: 'Carlos Mendes', initials: 'CM' },
    title: 'Respondeu a uma pergunta',
    time: '1 dia atrás',
    description: 'Esclareceu dúvida sobre o novo sistema',
    link: '/base-conhecimento'
  }
];

const getActivityIcon = (type: 'file' | 'image' | 'comment') => {
  switch (type) {
    case 'file':
      return <FileText className="h-4 w-4 text-supernosso-green" />;
    case 'image':
      return <FileImage className="h-4 w-4 text-supernosso-purple" />;
    case 'comment':
      return <MessageSquare className="h-4 w-4 text-blue-500" />;
  }
};

export function RecentActivity() {
  const [activeTab, setActiveTab] = useState<string>("all");
  
  const filteredActivities = activeTab === "all" 
    ? activities 
    : activities.filter(activity => activity.type === activeTab);
  
  return (
    <Card className="transition-all duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Atividades Recentes</CardTitle>
        <CardDescription>Veja as últimas atualizações da equipe</CardDescription>
        <Tabs defaultValue="all" className="mt-2" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full sm:w-auto">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="file">Arquivos</TabsTrigger>
            <TabsTrigger value="image">Imagens</TabsTrigger>
            <TabsTrigger value="comment">Comentários</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="space-y-4 pb-4">
        {filteredActivities.length > 0 ? (
          filteredActivities.map((activity) => (
            <div 
              key={activity.id}
              className="flex items-start space-x-3 pb-3 border-b last:border-b-0 animate-fade-in"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={activity.user.avatar} />
                <AvatarFallback className="bg-supernosso-purple text-white">
                  {activity.user.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{activity.user.name}</p>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {activity.time}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {getActivityIcon(activity.type)}
                  <p className="text-sm font-medium">{activity.title}</p>
                </div>
                {activity.description && (
                  <p className="text-xs text-gray-500 line-clamp-2">{activity.description}</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-gray-500">
            <p>Nenhuma atividade encontrada.</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Button variant="ghost" className="w-full text-supernosso-green hover:text-supernosso-green hover:bg-supernosso-light-green">
          Ver Todas as Atividades
        </Button>
      </CardFooter>
    </Card>
  );
}
