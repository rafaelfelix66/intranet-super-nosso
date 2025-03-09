
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

import Index from "./pages/Index";
import FileStorage from "./pages/FileStorage";
import Timeline from "./pages/Timeline";
import Chat from "./pages/Chat";
import KnowledgeBase from "./pages/KnowledgeBase";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Update Tailwind CSS variables to include the new red color
import { useEffect } from "react";

const queryClient = new QueryClient();

const App = () => {
  // Update the CSS variables for the supernosso-red color
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--supernosso-red', '#e60909');
    
    // Adicionar estilos para o chat
    const style = document.createElement('style');
    style.innerHTML = `
      .message-sent {
        color: #333 !important;
        font-weight: 500;
      }
      
      .message-received {
        color: #333 !important;
        font-weight: 500;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Register />} />
              
              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Index />} />
                <Route path="/arquivos" element={<FileStorage />} />
                <Route path="/timeline" element={<Timeline />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/base-conhecimento" element={<KnowledgeBase />} />
                <Route path="/configuracoes" element={<Settings />} />
              </Route>
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
