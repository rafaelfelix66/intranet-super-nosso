
import React, { useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Folder } from "lucide-react";
import { useFiles } from "@/contexts/FileContext";
import { toast } from "sonner";

interface NewFolderDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewFolderDialog = ({ isOpen, onOpenChange }: NewFolderDialogProps) => {
  const [folderName, setFolderName] = useState("");
  const { createNewFolder } = useFiles();
  
  const handleCreateFolder = () => {
    if (!folderName.trim()) {
      toast.error("O nome da pasta não pode estar vazio");
      return;
    }
    
    createNewFolder(folderName.trim());
    toast.success(`Pasta "${folderName}" criada com sucesso`);
    setFolderName("");
    onOpenChange(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Pasta</DialogTitle>
          <DialogDescription>
            Crie uma nova pasta para organizar seus arquivos.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <Folder className="h-12 w-12 text-supernosso-purple" />
            <div className="grid gap-2 flex-1">
              <Label htmlFor="folderName">Nome da pasta</Label>
              <Input 
                id="folderName" 
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Nova pasta"
                autoFocus
              />
            </div>
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
            onClick={handleCreateFolder} 
          >
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
