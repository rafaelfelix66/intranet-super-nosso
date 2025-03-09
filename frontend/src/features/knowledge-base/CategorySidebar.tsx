
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Category } from "./types";
import { cn } from "@/lib/utils";
import { Book, Star, Plus } from "lucide-react";

interface CategorySidebarProps {
  categories: Category[];
  articleCount: number;
  favoritesCount: number;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setIsCreatingArticle: (value: boolean) => void;
}

export const CategorySidebar: React.FC<CategorySidebarProps> = ({
  categories,
  articleCount,
  favoritesCount,
  activeTab,
  setActiveTab,
  setIsCreatingArticle
}) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Categorias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <button 
            className={cn(
              "w-full text-left px-3 py-2 rounded-md flex items-center gap-2 transition-colors",
              activeTab === "todos" 
                ? "bg-supernosso-light-red text-supernosso-red font-medium" 
                : "hover:bg-gray-100"
            )}
            onClick={() => setActiveTab("todos")}
          >
            <Book className="h-4 w-4" />
            <span>Todos os artigos</span>
            <span className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded-full">
              {articleCount}
            </span>
          </button>
          
          <button 
            className={cn(
              "w-full text-left px-3 py-2 rounded-md flex items-center gap-2 transition-colors",
              activeTab === "favoritos" 
                ? "bg-supernosso-light-red text-supernosso-red font-medium" 
                : "hover:bg-gray-100"
            )}
            onClick={() => setActiveTab("favoritos")}
          >
            <Star className="h-4 w-4" />
            <span>Favoritos</span>
            <span className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded-full">
              {favoritesCount}
            </span>
          </button>
          
          <div className="pt-2 border-t mt-2">
            {categories.map((category) => (
              <button 
                key={category.name}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md flex items-center gap-2 transition-colors",
                  activeTab === category.name.toLowerCase() 
                    ? "bg-supernosso-light-red text-supernosso-red font-medium" 
                    : "hover:bg-gray-100"
                )}
                onClick={() => setActiveTab(category.name.toLowerCase())}
              >
                {category.icon}
                <span>{category.name}</span>
                <span className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded-full">
                  {category.count}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Botão para adicionar novo artigo */}
      <Dialog>
        <DialogTrigger asChild>
          <Button 
            className="w-full flex items-center gap-2 bg-supernosso-red hover:bg-supernosso-red/90"
            onClick={() => setIsCreatingArticle(true)}
          >
            <Plus className="h-4 w-4" />
            Novo Artigo
          </Button>
        </DialogTrigger>
      </Dialog>
    </div>
  );
};
