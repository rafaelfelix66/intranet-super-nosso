
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArticleList } from "../ArticleList";
import { ArticleDetail } from "../ArticleDetail";
import { Article, Category } from "../types";

interface ArticleContentProps {
  selectedArticle: Article | null;
  filteredArticles: Article[];
  categories: Category[];
  activeTab: string;
  onArticleClick: (articleId: string) => void;
  onToggleFavorite: (articleId: string, event: React.MouseEvent) => void;
  onCloseArticle: () => void;
}

export const ArticleContent: React.FC<ArticleContentProps> = ({
  selectedArticle,
  filteredArticles,
  categories,
  activeTab,
  onArticleClick,
  onToggleFavorite,
  onCloseArticle
}) => {
  if (selectedArticle) {
    return (
      <ArticleDetail 
        article={selectedArticle} 
        onClose={onCloseArticle}
        onToggleFavorite={onToggleFavorite}
        categories={categories}
      />
    );
  }

  return (
    <Tabs defaultValue="relevantes" className="w-full">
      <div className="flex justify-between items-center">
        <TabsList>
          <TabsTrigger value="relevantes">Mais Relevantes</TabsTrigger>
          <TabsTrigger value="recentes">Mais Recentes</TabsTrigger>
          <TabsTrigger value="vistos">Mais Vistos</TabsTrigger>
        </TabsList>
        
        <div className="text-sm text-muted-foreground">
          {filteredArticles.length} artigos encontrados
        </div>
      </div>
      
      <TabsContent value="relevantes" className="mt-4 space-y-4">
        <ArticleList 
          articles={filteredArticles}
          categories={categories}
          selectedCategory={activeTab}
          onArticleClick={onArticleClick}
        />
      </TabsContent>
      
      <TabsContent value="recentes" className="mt-4 space-y-4">
        <ArticleList 
          articles={filteredArticles
            .sort((a, b) => new Date(b.date.split('/').reverse().join('-')).getTime() - 
                          new Date(a.date.split('/').reverse().join('-')).getTime())}
          categories={categories}
          selectedCategory={activeTab}
          onArticleClick={onArticleClick}
        />
      </TabsContent>
      
      <TabsContent value="vistos" className="mt-4 space-y-4">
        <ArticleList 
          articles={filteredArticles
            .sort((a, b) => b.views - a.views)}
          categories={categories}
          selectedCategory={activeTab}
          onArticleClick={onArticleClick}
        />
      </TabsContent>
    </Tabs>
  );
};
