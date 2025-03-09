
import React, { useState, useEffect } from "react";
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
import { FileItem, useFiles } from "@/contexts/FileContext";
import { toast } from "sonner";

interface RenameDialogProps {
  item: FileItem;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RenameDialog = ({ item, isOpen, onOpenChange }: RenameDialogProps) => {
  const [newName, setNewName] = useState("");
  const { renameItem } = useFiles();
  
  useEffect(() => {
    if (isOpen && item) {
      // For files, remove the extension from the initial name
      if (item.type === 'file' && item.extension) {
        setNewName(item.name.replace(`.${item.extension}`, ''));
      } else {
        setNewName(item.name);
      }
    }
  }, [isOpen, item]);
  
  const handleRename = () => {
    if (!newName.trim()) {
      toast.error("O nome não pode estar vazio");
      return;
    }
    
    renameItem(item.id, newName.trim());
    toast.success(`Item renomeado com sucesso`);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renomear {item.type === 'folder' ? 'Pasta' : 'Arquivo'}</DialogTitle>
          <DialogDescription>
            Digite o novo nome para {item.type === 'folder' ? 'a pasta' : 'o arquivo'}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="newName">Novo nome</Label>
            <Input 
              id="newName" 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
            {item.type === 'file' && item.extension && (
              <p className="text-xs text-gray-500">
                A extensão .{item.extension} será mantida automaticamente
              </p>
            )}
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
            onClick={handleRename} 
          >
            Renomear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
