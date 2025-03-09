import React, { createContext, useContext, useState, useEffect } from "react";
import { FileIcon, FolderIcon } from "lucide-react";

export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  icon: React.ReactNode;
  size?: string;
  modified: string;
  path: string;
  parentId?: string | null;
  extension?: string;
}

interface FileContextType {
  files: FileItem[];
  currentPath: string[];
  currentParentId: string | null;
  searchQuery: string;
  filteredFiles: FileItem[];
  setSearchQuery: (query: string) => void;
  navigateToFolder: (folder: FileItem) => void;
  navigateToBreadcrumb: (index: number) => void;
  createNewFolder: (name: string) => void;
  uploadFile: (file: File) => void;
  deleteItem: (id: string) => void;
  renameItem: (id: string, newName: string) => void;
}

const initialFiles: FileItem[] = [
  {
    id: 'root',
    name: 'Meus Arquivos',
    type: 'folder',
    icon: <FolderIcon className="h-10 w-10 text-supernosso-purple" />,
    modified: new Date().toLocaleDateString('pt-BR'),
    path: '/',
    parentId: null
  },
  {
    id: '1',
    name: 'Documentos',
    type: 'folder',
    icon: <FolderIcon className="h-10 w-10 text-supernosso-purple" />,
    modified: '10/06/2023',
    path: '/documentos',
    parentId: 'root'
  },
  {
    id: '2',
    name: 'Recursos Humanos',
    type: 'folder',
    icon: <FolderIcon className="h-10 w-10 text-supernosso-purple" />,
    modified: '05/06/2023',
    path: '/recursos-humanos',
    parentId: 'root'
  },
  {
    id: '3',
    name: 'Marketing',
    type: 'folder',
    icon: <FolderIcon className="h-10 w-10 text-supernosso-purple" />,
    modified: '01/06/2023',
    path: '/marketing',
    parentId: 'root'
  },
  {
    id: '4',
    name: 'Relatório Trimestral.pdf',
    type: 'file',
    icon: <FileIcon className="h-10 w-10 text-red-500" />,
    size: '2.4 MB',
    modified: '15/06/2023',
    path: '/relatorio-trimestral.pdf',
    parentId: 'root',
    extension: 'pdf'
  },
  {
    id: '5',
    name: 'Plano Estratégico 2023.docx',
    type: 'file',
    icon: <FileIcon className="h-10 w-10 text-blue-500" />,
    size: '1.8 MB',
    modified: '12/06/2023',
    path: '/plano-estrategico-2023.docx',
    parentId: 'root',
    extension: 'docx'
  },
  {
    id: '6',
    name: 'Lista de Preços.xlsx',
    type: 'file',
    icon: <FileIcon className="h-10 w-10 text-green-500" />,
    size: '3.2 MB',
    modified: '08/06/2023',
    path: '/lista-de-precos.xlsx',
    parentId: 'root',
    extension: 'xlsx'
  },
  // Files within Documentos folder
  {
    id: '7',
    name: 'Contrato.pdf',
    type: 'file',
    icon: <FileIcon className="h-10 w-10 text-red-500" />,
    size: '1.5 MB',
    modified: '20/06/2023',
    path: '/documentos/contrato.pdf',
    parentId: '1',
    extension: 'pdf'
  },
  {
    id: '8',
    name: 'Manual do Funcionário.docx',
    type: 'file',
    icon: <FileIcon className="h-10 w-10 text-blue-500" />,
    size: '4.2 MB',
    modified: '18/06/2023',
    path: '/documentos/manual-do-funcionario.docx',
    parentId: '1',
    extension: 'docx'
  },
  // Files within Recursos Humanos folder
  {
    id: '9',
    name: 'Folha de Pagamento.xlsx',
    type: 'file',
    icon: <FileIcon className="h-10 w-10 text-green-500" />,
    size: '1.1 MB',
    modified: '25/06/2023',
    path: '/recursos-humanos/folha-de-pagamento.xlsx',
    parentId: '2',
    extension: 'xlsx'
  },
  // Files within Marketing folder
  {
    id: '10',
    name: 'Campanha Q3.pptx',
    type: 'file',
    icon: <FileIcon className="h-10 w-10 text-orange-500" />,
    size: '5.7 MB',
    modified: '30/06/2023',
    path: '/marketing/campanha-q3.pptx',
    parentId: '3',
    extension: 'pptx'
  }
];

const FileContext = createContext<FileContextType | null>(null);

export const FileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [files, setFiles] = useState<FileItem[]>(initialFiles);
  const [currentPath, setCurrentPath] = useState<string[]>(['Meus Arquivos']);
  const [currentParentId, setCurrentParentId] = useState<string | null>('root');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([]);
  
  // Filter files by current folder and search query
  useEffect(() => {
    let filtered = files.filter(file => file.parentId === currentParentId);
    
    if (searchQuery) {
      filtered = filtered.filter(file => 
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredFiles(filtered);
  }, [files, currentParentId, searchQuery]);
  
  const findFolderPath = (folderId: string | null): string[] => {
    if (!folderId || folderId === 'root') return ['Meus Arquivos'];
    
    const folder = files.find(f => f.id === folderId);
    if (!folder) return ['Meus Arquivos'];
    
    const parentPath = findFolderPath(folder.parentId || null);
    return [...parentPath, folder.name];
  };
  
  const navigateToFolder = (folder: FileItem) => {
    if (folder.type !== 'folder') return;
    
    setCurrentParentId(folder.id);
    setCurrentPath(findFolderPath(folder.id));
  };
  
  const navigateToBreadcrumb = (index: number) => {
    if (index === 0) {
      // Root directory
      setCurrentParentId('root');
      setCurrentPath(['Meus Arquivos']);
      return;
    }
    
    // Get the folder name at this index
    const folderName = currentPath[index];
    
    // Find the folder ID based on the path up to this index
    const folderPath = currentPath.slice(0, index + 1);
    
    // Find the actual folder object
    let currentFolder: FileItem | undefined;
    
    // If we're clicking the last item, it's our current folder
    if (index === currentPath.length - 1) {
      currentFolder = files.find(f => f.name === folderName && f.type === 'folder');
    } else {
      // Otherwise, we need to find the folder in the path
      currentFolder = files.find(f => 
        f.name === folderName && 
        f.type === 'folder' && 
        findFolderPath(f.id).length === folderPath.length
      );
    }
    
    if (currentFolder) {
      setCurrentParentId(currentFolder.id);
      setCurrentPath(folderPath);
    }
  };
  
  const createNewFolder = (name: string) => {
    const newFolder: FileItem = {
      id: Date.now().toString(),
      name,
      type: 'folder',
      icon: <FolderIcon className="h-10 w-10 text-supernosso-purple" />,
      modified: new Date().toLocaleDateString('pt-BR'),
      path: `${currentPath.join('/')}/${name}`,
      parentId: currentParentId
    };
    
    setFiles([...files, newFolder]);
  };
  
  const uploadFile = (file: File) => {
    // Determine file icon based on extension
    const extension = file.name.split('.').pop() || '';
    let icon;
    
    switch(extension.toLowerCase()) {
      case 'pdf':
        icon = <FileIcon className="h-10 w-10 text-red-500" />;
        break;
      case 'docx':
      case 'doc':
        icon = <FileIcon className="h-10 w-10 text-blue-500" />;
        break;
      case 'xlsx':
      case 'xls':
        icon = <FileIcon className="h-10 w-10 text-green-500" />;
        break;
      case 'pptx':
      case 'ppt':
        icon = <FileIcon className="h-10 w-10 text-orange-500" />;
        break;
      case 'jpg':
      case 'jpeg':
      case 'png':
        icon = <FileIcon className="h-10 w-10 text-purple-500" />;
        break;
      default:
        icon = <FileIcon className="h-10 w-10 text-gray-500" />;
    }
    
    const newFile: FileItem = {
      id: Date.now().toString(),
      name: file.name,
      type: 'file',
      icon,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      modified: new Date().toLocaleDateString('pt-BR'),
      path: `${currentPath.join('/')}/${file.name}`,
      parentId: currentParentId,
      extension
    };
    
    setFiles([...files, newFile]);
  };
  
  const deleteItem = (id: string) => {
    // Delete item and its children if it's a folder
    const itemsToDelete = [id];
    
    // If it's a folder, find all children
    const findChildren = (parentId: string) => {
      const children = files.filter(f => f.parentId === parentId);
      children.forEach(child => {
        itemsToDelete.push(child.id);
        if (child.type === 'folder') {
          findChildren(child.id);
        }
      });
    };
    
    const item = files.find(f => f.id === id);
    if (item && item.type === 'folder') {
      findChildren(id);
    }
    
    setFiles(files.filter(f => !itemsToDelete.includes(f.id)));
  };
  
  const renameItem = (id: string, newName: string) => {
    setFiles(files.map(file => {
      if (file.id === id) {
        // Preserve extension for files
        let name = newName;
        if (file.type === 'file' && file.extension) {
          // Make sure the new name has the same extension
          if (!newName.endsWith(`.${file.extension}`)) {
            name = `${newName}.${file.extension}`;
          }
        }
        
        return {
          ...file,
          name,
          path: file.path.replace(file.name, name)
        };
      }
      return file;
    }));
  };
  
  return (
    <FileContext.Provider value={{
      files,
      currentPath,
      currentParentId,
      searchQuery,
      filteredFiles,
      setSearchQuery,
      navigateToFolder,
      navigateToBreadcrumb,
      createNewFolder,
      uploadFile,
      deleteItem,
      renameItem
    }}>
      {children}
    </FileContext.Provider>
  );
};

export const useFiles = () => {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error("useFiles must be used within a FileProvider");
  }
  return context;
};
