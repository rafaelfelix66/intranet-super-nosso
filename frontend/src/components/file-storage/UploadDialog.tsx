
import React, { useRef, useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useFiles } from "@/contexts/FileContext";
import { toast } from "sonner";

interface UploadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UploadDialog = ({ isOpen, onOpenChange }: UploadDialogProps) => {
  const { uploadFile } = useFiles();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleUpload = () => {
    if (selectedFile) {
      uploadFile(selectedFile);
      toast.success(`Arquivo ${selectedFile.name} enviado com sucesso`);
      setSelectedFile(null);
      onOpenChange(false);
    } else {
      toast.error("Selecione um arquivo para enviar");
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-supernosso-green hover:bg-supernosso-green/90">
          <Upload className="mr-2 h-4 w-4" />
          Enviar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar Arquivo</DialogTitle>
          <DialogDescription>
            Selecione um arquivo do seu computador para enviar.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div 
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
              selectedFile ? 'border-supernosso-green bg-supernosso-green/5' : 'border-gray-300 hover:border-supernosso-green'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <Upload className={`h-12 w-12 mx-auto mb-4 ${selectedFile ? 'text-supernosso-green' : 'text-gray-400'}`} />
            <div className="text-sm text-gray-600">
              {selectedFile 
                ? `Arquivo selecionado: ${selectedFile.name}` 
                : "Arraste e solte arquivos aqui ou clique para selecionar"}
            </div>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button 
            className="bg-supernosso-green hover:bg-supernosso-green/90"
            onClick={handleUpload}
            disabled={!selectedFile}
          >
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
