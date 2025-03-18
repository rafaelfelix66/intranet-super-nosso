//src\features\knowledge-base\ArticleList.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  HelpCircle,
  ChevronRight,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Article, Category } from "./types";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface ArticleListProps {
  articles: Article[];
  categories: Category[];
  selectedCategory: string;
  onArticleClick: (articleId: string) => void;
  isLoading: boolean;
  error: string | null;
  onRefresh?: () => void;
}

export function ArticleList({ 
  articles, 
  categories, 
  selectedCategory,
  onArticleClick,
  isLoading,
  error,
  onRefresh
}: ArticleListProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredArticles = articles.filter(article => {
    const matchesCategory = selectedCategory === "all" || 
                           selectedCategory === "todos" || 
                           article.categoryId === selectedCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (article.content && article.content.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });
  
  const getCategoryNameById = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : "";
  };
  
  const getCategoryColorById = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.color : "gray";
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-supernosso-red mb-4" />
        <p className="text-muted-foreground">Carregando artigos...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertTitle>Erro ao carregar artigos</AlertTitle>
        <AlertDescription>
          {error}
          {onRefresh && (
            <Button variant="outline" size="sm" className="ml-2 mt-2" onClick={onRefresh}>
              Tentar novamente
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar artigos..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => navigate("/base-conhecimento/novo")}>
          Novo Artigo
        </Button>
      </div>
      
      {filteredArticles.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-4 inline-block">
            <HelpCircle className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium mt-4">Nenhum artigo encontrado</h3>
          <p className="text-muted-foreground mt-1">
            {searchQuery ? "Tente mudar os termos da busca" : "Crie um novo artigo para começar"}
          </p>
        </div>
      )}
      
      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-1">
        {filteredArticles.map((article) => (
          <Card 
            key={article.id} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => {
              // Se temos uma função de click passada como prop, usamos ela
              if (onArticleClick) {
                onArticleClick(article.id);
              } else {
                // Caso contrário, navegamos para a página do artigo
                navigate(`/base-conhecimento/${article.id}`);
              }
            }}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className={cn("bg-" + getCategoryColorById(article.categoryId))}>
                      {getCategoryNameById(article.categoryId)}
                    </Badge>
                    {article.pinned && (
                      <Badge variant="outline" className="text-orange-500 border-orange-200 bg-orange-50">
                        Destacado
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-medium text-lg">{article.title}</h3>
                  <p className="text-muted-foreground line-clamp-2">{article.description || article.content}</p>
                  
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={article.author.avatar} alt={article.author.name} />
                        <AvatarFallback className="text-xs">{article.author.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">{article.author.name}</span>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">{article.date}</span>
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
