
import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";

// Import components and hooks
import { ArticleForm } from "@/features/knowledge-base/ArticleForm";
import { CategorySidebar } from "@/features/knowledge-base/CategorySidebar";
import { categories } from "@/features/knowledge-base/mock-data";
import { SearchBar } from "@/features/knowledge-base/components/SearchBar";
import { ArticleContent } from "@/features/knowledge-base/components/ArticleContent";
import { useArticles } from "@/features/knowledge-base/hooks/useArticles";

const KnowledgeBase = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("todos");
  
  const {
    articles,
    selectedArticle,
    isCreatingArticle,
    newArticle,
    newTag,
    setIsCreatingArticle,
    setNewArticle,
    setNewTag,
    handleArticleClick,
    handleCloseArticle,
    handleToggleFavorite,
    handleAddTag,
    handleRemoveTag,
    handleCreateArticle
  } = useArticles();
  
  const filteredArticles = articles.filter(article => {
    const matchesSearch = 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      article.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (activeTab === "todos") return matchesSearch;
    if (activeTab === "favoritos") return matchesSearch && article.favorite;
    return matchesSearch && article.categoryId.toLowerCase() === activeTab.toLowerCase();
  });

  const handleCloseNewArticleDialog = () => {
    setIsCreatingArticle(false);
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Base de Conhecimento</h1>
          <p className="text-muted-foreground">
            Acesse artigos, manuais e documentações para consulta rápida
          </p>
        </div>
        
        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar with Categories */}
          <div>
            <CategorySidebar 
              categories={categories}
              articleCount={articles.length}
              favoritesCount={articles.filter(a => a.favorite).length}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              setIsCreatingArticle={setIsCreatingArticle}
            />
          </div>
          
          {/* Main Content: Article List or Article Detail */}
          <div className="md:col-span-3 space-y-4">
            <ArticleContent 
              selectedArticle={selectedArticle}
              filteredArticles={filteredArticles}
              categories={categories}
              activeTab={activeTab}
              onArticleClick={handleArticleClick}
              onToggleFavorite={handleToggleFavorite}
              onCloseArticle={handleCloseArticle}
            />
          </div>
        </div>
      </div>

      {/* Dialog for creating new article */}
      <Dialog open={isCreatingArticle} onOpenChange={setIsCreatingArticle}>
        <ArticleForm 
          newArticle={newArticle}
          setNewArticle={setNewArticle}
          newTag={newTag}
          setNewTag={setNewTag}
          handleAddTag={handleAddTag}
          handleRemoveTag={handleRemoveTag}
          handleCreateArticle={handleCreateArticle}
          onClose={handleCloseNewArticleDialog}
          categories={categories}
        />
      </Dialog>
    </Layout>
  );
};

export default KnowledgeBase;
