// src/components/file-storage/NewFolderDialog.tsx - Versão melhorada
import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Upload, Image as ImageIcon } from "lucide-react";
import { useFiles } from "@/contexts/FileContext";
import { Card, CardContent } from "@/components/ui/card";

interface NewFolderDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

import DepartamentoSelector from "@/components/timeline/DepartamentoSelector";

export const NewFolderDialog = ({ isOpen, onOpenChange }: NewFolderDialogProps) => {
  const [folderName, setFolderName] = useState("");
  const [folderDescription, setFolderDescription] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(['TODOS']);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { createNewFolder } = useFiles();
  
  // Manipuladores de departamentos - usando o componente centralizado
  const handleDepartmentChange = (departments: string[]) => {
    setSelectedDepartments(departments);
  };
  
  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    
    setIsLoading(true);
    try {
      await createNewFolder(folderName, folderDescription, coverImage, {
        departamentoVisibilidade: selectedDepartments
      });
      
      // Reset form
      setFolderName("");
      setFolderDescription("");
      setCoverImage(null);
      setCoverPreview(null);
      setSelectedDepartments(['TODOS']);
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validar tamanho do arquivo (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB');
        return;
      }
      
      // Validar tipo do arquivo
      if (!file.type.startsWith('image/')) {
        alert('Apenas imagens são permitidas');
        return;
      }
      
      setCoverImage(file);
      
      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const removeCoverImage = () => {
    setCoverImage(null);
    setCoverPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setFolderName("");
      setFolderDescription("");
      setCoverImage(null);
      setCoverPreview(null);
      setSelectedDepartments(['TODOS']);
    }
    onOpenChange(open);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Pasta</DialogTitle>
          <DialogDescription>
            Crie uma nova pasta para organizar seus arquivos e links.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          {/* Nome da pasta */}
          <div className="space-y-2">
            <Label htmlFor="folder-name">Nome da pasta *</Label>
            <Input
              id="folder-name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Digite o nome da pasta"
              className="focus-visible:ring-[#e60909]"
            />
          </div>
          
          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="folder-description">Descrição (opcional)</Label>
            <Textarea
              id="folder-description"
              value={folderDescription}
              onChange={(e) => setFolderDescription(e.target.value)}
              placeholder="Digite uma breve descrição da pasta"
              className="focus-visible:ring-[#e60909]"
              rows={3}
            />
          </div>
          
          {/* Imagem de capa */}
          <div className="space-y-2">
            <Label>Capa da pasta (opcional)</Label>
            <div 
              className={`
                border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
                transition-all duration-200 hover:border-[#e60909] hover:bg-[#e60909]/5
                ${coverPreview ? 'border-[#e60909] bg-[#e60909]/5' : 'border-gray-300'}
              `}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverImageChange}
                className="hidden"
              />
              
              {coverPreview ? (
                <div className="relative">
                  <div className="aspect-video w-full overflow-hidden rounded-lg max-w-sm mx-auto">
                    <img 
                      src={coverPreview} 
                      alt="Capa da pasta" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCoverImage();
                    }}
                  >
                    Remover imagem
                  </Button>
                </div>
              ) : (
                <div className="py-6">
                  <Upload className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-1">
                    Clique para adicionar uma imagem de capa
                  </p>
                  <p className="text-xs text-gray-500">
                    JPG, PNG ou GIF (máx. 5MB)
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Visibilidade por departamento */}
          <div className="space-y-3">
            <Label>Visibilidade por Departamento</Label>
            <Card className="border-gray-200">
              <CardContent className="pt-4">
                <DepartamentoSelector 
                  onChange={handleDepartmentChange}
                  initialSelected={selectedDepartments}
                  showLabel={false}
                  compact={false}
                />
              </CardContent>
            </Card>
            <p className="text-xs text-gray-500">
              Selecione quais departamentos podem acessar esta pasta
            </p>
          </div>
          
          {/* Informações adicionais */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="flex items-start space-x-2">
                <ImageIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Dicas para organizar pastas
                  </p>
                  <ul className="text-sm text-blue-700 mt-1 space-y-1">
                    <li>• Use nomes descritivos e organizados</li>
                    <li>• A imagem de capa ajuda na identificação visual</li>
                    <li>• Configure a visibilidade apropriada para cada departamento</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreateFolder}
            disabled={!folderName.trim() || isLoading}
            className="bg-[#e60909] hover:bg-[#e60909]/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              "Criar Pasta"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};