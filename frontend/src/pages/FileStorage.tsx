//src/pages/FileStorage.tsx
import React from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FileProvider } from "@/contexts/FileContext";
import { FileHeader } from "@/components/file-storage/FileHeader";
import { FileBreadcrumb } from "@/components/file-storage/FileBreadcrumb";
import { FileGrid } from "@/components/file-storage/FileGrid";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const FileStorage = () => {
  return (
    <Layout>
      <FileProvider>
        <div className="space-y-6">
          <FileHeader />
          
          <Alert variant="info" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Integração com o backend</AlertTitle>
            <AlertDescription>
              Este módulo agora está conectado à API de arquivos no backend.
              Você pode criar pastas, fazer upload e download de arquivos.
            </AlertDescription>
          </Alert>
          
          <Card>
            <CardHeader className="pb-3">
              <FileBreadcrumb />
            </CardHeader>
            <CardContent>
              <FileGrid />
            </CardContent>
          </Card>
        </div>
      </FileProvider>
    </Layout>
  );
};

export default FileStorage;