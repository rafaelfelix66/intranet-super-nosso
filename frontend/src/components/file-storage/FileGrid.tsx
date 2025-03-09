
import React from "react";
import { Clock, MoreHorizontal } from "lucide-react";
import { useFiles, FileItem } from "@/contexts/FileContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { FileViewer } from "./FileViewer";
import { useState } from "react";
import { RenameDialog } from "./RenameDialog";

export const FileGrid = () => {
  const { filteredFiles, navigateToFolder, deleteItem } = useFiles();
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [itemToRename, setItemToRename] = useState<FileItem | null>(null);
  
  const handleItemClick = (file: FileItem) => {
    if (file.type === 'folder') {
      navigateToFolder(file);
    } else {
      setSelectedFile(file);
      setFileViewerOpen(true);
    }
  };
  
  const handleDownload = (file: FileItem) => {
    toast.success(`Iniciando download: ${file.name}`);
    // In a real app, this would trigger an actual download
  };
  
  const handleDelete = (id: string, name: string) => {
    deleteItem(id);
    toast.success(`${name} excluído com sucesso`);
  };
  
  const handleRename = (file: FileItem) => {
    setItemToRename(file);
    setRenameDialogOpen(true);
  };
  
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredFiles.map((file) => (
          <div 
            key={file.id} 
            className="border relative rounded-lg p-4 hover:border-supernosso-green/70 hover:shadow-sm transition-all cursor-pointer hover-lift"
            onClick={() => handleItemClick(file)}
          >
            <div className="flex flex-col items-center">
              {file.icon}
              <div className="mt-2 text-center">
                <p className="font-medium line-clamp-1">{file.name}</p>
                <p className="text-xs text-gray-500 flex items-center justify-center mt-1">
                  <Clock className="h-3 w-3 mr-1" />
                  {file.modified}
                  {file.size && <span className="ml-2">({file.size})</span>}
                </p>
              </div>
            </div>
            
            <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {file.type === 'file' && (
                    <DropdownMenuItem onClick={() => handleDownload(file)}>
                      Baixar
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => handleRename(file)}>
                    Renomear
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-500" onClick={() => handleDelete(file.id, file.name)}>
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
        
        {filteredFiles.length === 0 && (
          <div className="col-span-full text-center py-12">
            <FileIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium">Nenhum arquivo encontrado</h3>
            <p className="text-sm text-gray-500">
              {useFiles().searchQuery 
                ? `Não encontramos resultados para "${useFiles().searchQuery}"`
                : "Esta pasta está vazia. Comece enviando arquivos ou criando pastas."}
            </p>
          </div>
        )}
      </div>
      
      {selectedFile && (
        <FileViewer 
          file={selectedFile} 
          isOpen={fileViewerOpen} 
          onOpenChange={setFileViewerOpen} 
        />
      )}
      
      {itemToRename && (
        <RenameDialog 
          item={itemToRename}
          isOpen={renameDialogOpen}
          onOpenChange={setRenameDialogOpen}
        />
      )}
    </>
  );
};

// Workaround to avoid circular dependency
const FileIcon = (props: any) => {
  return <div {...props} />;
};
