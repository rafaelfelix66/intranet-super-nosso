
import React from "react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { FileItem } from "@/contexts/FileContext";
import { toast } from "sonner";

interface FileViewerProps {
  file: FileItem;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FileViewer = ({ file, isOpen, onOpenChange }: FileViewerProps) => {
  const handleDownload = () => {
    toast.success(`Iniciando download: ${file.name}`);
    // In a real app, this would trigger an actual download
  };
  
  // Determine preview content based on file extension
  const renderPreview = () => {
    const extension = file.extension?.toLowerCase();
    
    switch(extension) {
      case 'pdf':
        return (
          <div className="bg-red-50 rounded-lg p-10 text-center">
            <div className="mx-auto w-20 h-20 flex items-center justify-center bg-red-100 rounded-full mb-4">
              {file.icon}
            </div>
            <h3 className="text-lg font-semibold mb-2">Documento PDF</h3>
            <p className="text-sm text-gray-500 mb-4">
              Visualização incorporada indisponível. Clique em baixar para ver o arquivo.
            </p>
          </div>
        );
      case 'docx':
      case 'doc':
        return (
          <div className="bg-blue-50 rounded-lg p-10 text-center">
            <div className="mx-auto w-20 h-20 flex items-center justify-center bg-blue-100 rounded-full mb-4">
              {file.icon}
            </div>
            <h3 className="text-lg font-semibold mb-2">Documento Word</h3>
            <p className="text-sm text-gray-500 mb-4">
              Visualização incorporada indisponível. Clique em baixar para ver o arquivo.
            </p>
          </div>
        );
      case 'xlsx':
      case 'xls':
        return (
          <div className="bg-green-50 rounded-lg p-10 text-center">
            <div className="mx-auto w-20 h-20 flex items-center justify-center bg-green-100 rounded-full mb-4">
              {file.icon}
            </div>
            <h3 className="text-lg font-semibold mb-2">Planilha Excel</h3>
            <p className="text-sm text-gray-500 mb-4">
              Visualização incorporada indisponível. Clique em baixar para ver o arquivo.
            </p>
          </div>
        );
      case 'pptx':
      case 'ppt':
        return (
          <div className="bg-orange-50 rounded-lg p-10 text-center">
            <div className="mx-auto w-20 h-20 flex items-center justify-center bg-orange-100 rounded-full mb-4">
              {file.icon}
            </div>
            <h3 className="text-lg font-semibold mb-2">Apresentação PowerPoint</h3>
            <p className="text-sm text-gray-500 mb-4">
              Visualização incorporada indisponível. Clique em baixar para ver o arquivo.
            </p>
          </div>
        );
      case 'jpg':
      case 'jpeg':
      case 'png':
        return (
          <div className="text-center">
            <img 
              src="/placeholder.svg" 
              alt={file.name} 
              className="max-h-96 mx-auto rounded-lg object-contain" 
            />
          </div>
        );
      default:
        return (
          <div className="bg-gray-50 rounded-lg p-10 text-center">
            <div className="mx-auto w-20 h-20 flex items-center justify-center bg-gray-100 rounded-full mb-4">
              {file.icon}
            </div>
            <h3 className="text-lg font-semibold mb-2">Arquivo {file.extension}</h3>
            <p className="text-sm text-gray-500 mb-4">
              Visualização não disponível para este tipo de arquivo.
            </p>
          </div>
        );
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="line-clamp-1">{file.name}</span>
            <span className="text-xs text-gray-500 font-normal">
              {file.size}
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4 min-h-[300px] flex items-center justify-center">
          {renderPreview()}
        </div>
        
        <DialogFooter>
          <div className="flex w-full justify-between items-center">
            <div className="text-xs text-gray-500">
              Última modificação: {file.modified}
            </div>
            <Button onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Baixar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
