
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Home, 
  FileText, 
  Image, 
  MessageSquare, 
  HelpCircle, 
  Menu, 
  X, 
  Settings, 
  LogOut 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarItemProps {
  icon: React.ElementType;
  to: string;
  label: string;
  active: boolean;
  isOpen: boolean;
}

const SidebarItem = ({ icon: Icon, to, label, active, isOpen }: SidebarItemProps) => {
  return (
    <Link to={to} className="w-full">
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start gap-3 my-1 font-normal transition-all",
          !isOpen && "px-0 justify-center",
          active ? "bg-[#e60909]/20 text-[#e60909]" : "hover:bg-[#e60909]/20 hover:text-[#e60909]"
        )}
      >
        <Icon size={20} />
        {isOpen && <span>{label}</span>}
      </Button>
    </Link>
  );
};

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(!isMobile);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && isOpen) {
        const sidebar = document.getElementById("sidebar");
        const menuButton = document.getElementById("menu-toggle");
        
        if (sidebar && 
            !sidebar.contains(event.target as Node) && 
            menuButton && 
            !menuButton.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobile, isOpen]);

  // Close sidebar when navigating on mobile
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [location.pathname, isMobile]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const getActivePath = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
  };

  const goToSettings = () => {
    navigate("/configuracoes");
  };

  return (
    <>
      {isMobile && (
        <Button
          id="menu-toggle"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50"
        >
          <Menu />
        </Button>
      )}
      
      <div 
        id="sidebar"
        className={cn(
          "fixed top-0 left-0 h-full shadow-lg transition-all duration-300 z-40",
          isOpen ? "w-64" : isMobile ? "w-0 -translate-x-full" : "w-16",
          "flex flex-col overflow-hidden bg-[#e60909] text-white"
        )}
      >
        <div className="p-4 border-b border-white/20 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <img 
              src="/super-nosso-logo.png" 
              alt="Super Nosso Logo" 
              className="h-8 w-auto object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://via.placeholder.com/40x40/FFFFFF/FFFFFF?text=SN";
              }}
            />
            {isOpen && <span className="font-bold text-white">Intranet</span>}
          </div>
          {isMobile && isOpen && (
            <Button variant="ghost" size="icon" className="text-white hover:bg-[#e60909]/90" onClick={toggleSidebar}>
              <X size={20} />
            </Button>
          )}
          {!isMobile && (
            <Button variant="ghost" size="icon" className="text-white hover:bg-[#e60909]/90" onClick={toggleSidebar}>
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
          )}
        </div>
        
        <div className="flex-1 overflow-auto py-2 px-3">
          <SidebarItem 
            icon={Home} 
            to="/" 
            label="Início" 
            active={getActivePath("/")} 
            isOpen={isOpen}
          />
          <SidebarItem 
            icon={FileText} 
            to="/arquivos" 
            label="Arquivos" 
            active={getActivePath("/arquivos")} 
            isOpen={isOpen}
          />
          <SidebarItem 
            icon={Image} 
            to="/timeline" 
            label="Timeline" 
            active={getActivePath("/timeline")} 
            isOpen={isOpen}
          />
          <SidebarItem 
            icon={MessageSquare} 
            to="/chat" 
            label="Chat" 
            active={getActivePath("/chat")} 
            isOpen={isOpen}
          />
          <SidebarItem 
            icon={HelpCircle} 
            to="/base-conhecimento" 
            label="Base de Conhecimento" 
            active={getActivePath("/base-conhecimento")} 
            isOpen={isOpen}
          />
          <SidebarItem 
            icon={Settings} 
            to="/configuracoes" 
            label="Configurações" 
            active={getActivePath("/configuracoes")} 
            isOpen={isOpen}
          />
        </div>
        
        <div className={cn("p-4 border-t border-white/20", !isOpen && "flex justify-center")}>
          <div 
            className={cn(
              "flex items-center gap-3 cursor-pointer transition-colors hover:bg-[#e60909]/90 p-2 rounded-md",
              !isOpen && "justify-center p-1"
            )}
            onClick={goToSettings}  
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src="" />
              <AvatarFallback className="bg-white text-[#e60909]">
                {user?.name?.substring(0, 2).toUpperCase() || "SN"}
              </AvatarFallback>
            </Avatar>
            {isOpen && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate text-white">{user?.name || "Funcionário"}</p>
                <p className="text-xs text-white/70 truncate">{user?.email || "funcionario@supernosso.com.br"}</p>
              </div>
            )}
            {isOpen ? (
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:text-white hover:bg-[#e60909]/90"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogout();
                }}
              >
                <LogOut size={18} />
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:text-white hover:bg-[#e60909]/90 ml-0 p-0 h-auto w-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogout();
                }}
              >
                <LogOut size={18} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
