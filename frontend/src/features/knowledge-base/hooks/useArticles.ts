
import { useState } from "react";
import { Article } from "../types";
import { mockArticles } from "../mock-data";
import { useToast } from "@/hooks/use-toast";

export const useArticles = () => {
  const [articles, setArticles] = useState<Article[]>(mockArticles);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isCreatingArticle, setIsCreatingArticle] = useState(false);
  const [newArticle, setNewArticle] = useState<Partial<Article>>({
    title: "",
    description: "",
    categoryId: "sistemas",
    tags: [],
    content: "",
  });
  const [newTag, setNewTag] = useState("");
  const { toast } = useToast();
  
  const handleArticleClick = (articleId: string) => {
    const article = articles.find(a => a.id === articleId);
    if (article) {
      setSelectedArticle(article);
      // Increment view count when an article is viewed
      setArticles(prev => 
        prev.map(a => a.id === articleId ? {...a, views: a.views + 1} : a)
      );
    }
  };

  const handleCloseArticle = () => {
    setSelectedArticle(null);
  };

  const handleToggleFavorite = (articleId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setArticles(prev => 
      prev.map(article => 
        article.id === articleId 
          ? {...article, favorite: !article.favorite} 
          : article
      )
    );
  };

  const handleAddTag = () => {
    if (newTag && !newArticle.tags?.includes(newTag)) {
      setNewArticle({
        ...newArticle,
        tags: [...(newArticle.tags || []), newTag]
      });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setNewArticle({
      ...newArticle,
      tags: newArticle.tags?.filter(t => t !== tag)
    });
  };

  const handleCreateArticle = () => {
    if (!newArticle.title || !newArticle.description || !newArticle.content) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const createdArticle: Article = {
      id: Date.now().toString(),
      title: newArticle.title || "",
      description: newArticle.description || "",
      categoryId: newArticle.categoryId || "sistemas",
      tags: newArticle.tags || [],
      views: 0,
      date: new Date().toLocaleDateString(),
      favorite: false,
      content: newArticle.content || "",
      pinned: false,
      author: {
        name: "Usuário Atual",
        avatar: ""
      }
    };

    setArticles(prev => [...prev, createdArticle]);
    setIsCreatingArticle(false);
    setNewArticle({
      title: "",
      description: "",
      categoryId: "sistemas",
      tags: [],
      content: "",
    });

    toast({
      title: "Artigo criado",
      description: "Seu artigo foi criado com sucesso!",
    });
  };

  return {
    articles,
    selectedArticle,
    isCreatingArticle,
    newArticle,
    newTag,
    setArticles,
    setSelectedArticle,
    setIsCreatingArticle,
    setNewArticle,
    setNewTag,
    handleArticleClick,
    handleCloseArticle,
    handleToggleFavorite,
    handleAddTag,
    handleRemoveTag,
    handleCreateArticle
  };
};
