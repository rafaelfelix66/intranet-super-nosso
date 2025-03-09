
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Article, Category } from "./types";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

interface ArticleDetailProps {
  article: Article;
  onClose: () => void;
  onToggleFavorite: (articleId: string, event: React.MouseEvent) => void;
  categories: Category[]; // Add categories prop
}

export const ArticleDetail: React.FC<ArticleDetailProps> = ({
  article,
  onClose,
  onToggleFavorite,
  categories
}) => {
  // Function to get category name from categoryId
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : "";
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold">{article.title}</h2>
            <p className="text-muted-foreground mt-1">{article.description}</p>
            
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="bg-supernosso-light-red text-supernosso-red text-xs px-2 py-1 rounded-full">
                {getCategoryName(article.categoryId)}
              </span>
              
              {article.tags.map((tag) => (
                <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            Voltar
          </Button>
        </div>
        
        <div className="mt-6 border-t pt-4">
          <div className="prose max-w-none">
            {article.content?.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-8 pt-4 border-t text-sm text-gray-500">
          <div className="flex items-center gap-3">
            <span>{article.views} visualizações</span>
            <span>Atualizado em: {article.date}</span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => onToggleFavorite(article.id, e)}
            className={article.favorite ? "text-supernosso-red" : ""}
          >
            <Star className={cn("h-5 w-5 mr-1", article.favorite && "fill-supernosso-red")} />
            {article.favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
