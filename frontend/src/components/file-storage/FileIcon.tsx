
import React from "react";
import { FileText, Folder } from "lucide-react";

interface FileIconProps {
  extension?: string;
  size?: number;
  type: 'file' | 'folder';
}

export const FileIcon: React.FC<FileIconProps> = ({ extension, size = 40, type }) => {
  if (type === 'folder') {
    return <Folder size={size} className="text-supernosso-purple" />;
  }
  
  // Determine color based on file extension
  let color = "text-gray-500";
  
  switch(extension?.toLowerCase()) {
    case 'pdf':
      color = "text-red-500";
      break;
    case 'docx':
    case 'doc':
      color = "text-blue-500";
      break;
    case 'xlsx':
    case 'xls':
      color = "text-green-500";
      break;
    case 'pptx':
    case 'ppt':
      color = "text-orange-500";
      break;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      color = "text-purple-500";
      break;
  }
  
  return <FileText size={size} className={color} />;
};
