
import React, { useState } from "react";
import { Search, Upload, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFiles } from "@/contexts/FileContext";
import { NewFolderDialog } from "./NewFolderDialog";
import { UploadDialog } from "./UploadDialog";

export const FileHeader = () => {
  const { searchQuery, setSearchQuery } = useFiles();
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold">Arquivos</h1>
        <p className="text-muted-foreground">Armazene e gerencie seus documentos</p>
      </div>
      
      <div className="flex gap-2 w-full sm:w-auto">
        <div className="relative flex-1 sm:flex-initial">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Buscar arquivos..." 
            value={searchQuery}
            onChange={handleSearch}
            className="pl-8 focus-visible:ring-supernosso-green w-full"
          />
        </div>
        
        <UploadDialog 
          isOpen={isUploadDialogOpen} 
          onOpenChange={setIsUploadDialogOpen} 
        />
        
        <Button 
          variant="outline"
          onClick={() => setIsNewFolderDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Pasta
        </Button>
        
        <NewFolderDialog 
          isOpen={isNewFolderDialogOpen} 
          onOpenChange={setIsNewFolderDialogOpen} 
        />
      </div>
    </div>
  );
};
