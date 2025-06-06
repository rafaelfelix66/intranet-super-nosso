// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PrivateRoute } from "@/components/auth/PrivateRoute";
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PermissionManagement } from '@/components/admin/PermissionManagement';
import { Navigate } from "react-router-dom";
import { PermissionGuard } from '@/components/auth/PermissionGuard'; // Ajuste o caminho conforme necessário
import Home from "./pages/Home";
import EngagementDashboard from "./pages/EngagementDashboard";
//import Index from "./pages/Index";
import FileStorage from "./pages/FileStorage";
//import Timeline from "./pages/Timeline";
import Chat from "./pages/Chat";
import KnowledgeBase from "./pages/KnowledgeBase";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ArticlePage from "./pages/ArticlePage";
import NewArticlePage from "./pages/NewArticlePage";
import BannerAdmin from "./pages/BannerAdmin";
import Unauthorized from "./pages/Unauthorized";
import Chat from "./pages/Chat";
import SuperCoinsAdmin from "./pages/SuperCoinsAdmin";
import Institutional from "./pages/Institutional";
import UsefulLinksPage from "./pages/UsefulLinksPage";
import JobPositions from "./pages/JobPositions";
import Learning from "./pages/Learning";

// Update Tailwind CSS variables to include the new red color
import { useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

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
      
      /* Estilos adicionais para o calendário e atividades */
      .calendar-day-with-event:after {
        content: '';
        position: absolute;
        bottom: 2px;
        left: 50%;
        transform: translateX(-50%);
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background-color: var(--supernosso-red);
      }
      
      .activity-item-highlight:hover {
        background-color: rgba(230, 9, 9, 0.05);
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
              {/* Rotas públicas */}
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Register />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              
              {/* Rota principal (requer apenas autenticação) */}
              <Route 
                path="/" 
               element={
               <PrivateRoute requiredPermission="timeline:view">
                 <Home />
               </PrivateRoute>
                } 
              />
              
              {/* Rotas que requerem permissões específicas */}
              <Route 
                path="/arquivos" 
                element={
                  <PrivateRoute requiredPermission="files:view">
                    <FileStorage />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/timeline" 
                element={<Navigate to="/" replace />} 
              />
              
              <Route 
                path="/chat" 
                element={
                  <PrivateRoute requiredPermission="chat:access">
                    <Chat />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/base-conhecimento" 
                element={
                  <PrivateRoute requiredPermission="knowledge:view">
                    <KnowledgeBase />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/base-conhecimento/:id" 
                element={
                  <PrivateRoute requiredPermission="knowledge:view">
                    <ArticlePage />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/base-conhecimento/novo" 
                element={
                  <PrivateRoute requiredPermission="knowledge:create">
                    <NewArticlePage />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/configuracoes" 
                element={
                  <PrivateRoute>
                    <Settings />
                  </PrivateRoute>
                } 
              />
              
              {/* Rotas administrativas */}
              <Route 
                path="/admin/banners" 
                element={
                  <PrivateRoute requiredPermission="banners:manage">
                    <BannerAdmin />
                  </PrivateRoute>
                } 
              />
			  
			  <Route 
				  path="/admin/permissions" 
				  element={
					<PrivateRoute requiredPermission="roles:manage">
					  <PermissionManagement />
					</PrivateRoute>
				  } 
				/>
			  <Route 
				  path="/admin/engagement" 
				  element={
					<PrivateRoute requiredPermission="admin:dashboard">
					  <EngagementDashboard />
					</PrivateRoute>
				  } 
				/>
			  <Route 
				  path="/admin/supercoins" 
				  element={
					<PrivateRoute requiredPermission="supercoins:manage">
					  <SuperCoinsAdmin />
					</PrivateRoute>
				  } 
				/>
			  <Route 
				  path="/institucional" 
				  element={
					<PrivateRoute>
					  <Institutional />
					</PrivateRoute>
				  } 
				/>
			  <Route 
				 path="/links-uteis" 
				 element={
				<PrivateRoute requiredPermission="useful_links:view">
				  <UsefulLinksPage />
				</PrivateRoute>
			      } 
				/>
		      <Route 
				  path="/vagas" 
				  element={
					<PrivateRoute>
					  <JobPositions />
					</PrivateRoute>
				  } 
				/>
			 <Route 
				 path="/aprendizagem" 
				 element={
				<PrivateRoute requiredPermission="courses:view">
				  <Learning />
				</PrivateRoute>
				  }
			    />	
				
              
              {/* Rota para página não encontrada */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;