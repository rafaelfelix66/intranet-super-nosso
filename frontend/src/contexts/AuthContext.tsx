// src/contexts/AuthContext.tsx (modificado)
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { activitiesService } from '@/services/activitiesService';
import { calendarService } from '@/services/calendarService';
import { api } from '@/lib/api';

interface User {
  id: string;
  name: string;
  cpf: string;  // Adicionado CPF
  email: string;
  chapa?: string;
  cargo?: string;
  department?: string;
  filial?: string;
  dataAdmissao?: string;
  dataNascimento?: string;
  avatar?: string;
  roles?: string[];
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (cpf: string, password: string) => Promise<void>;  // Modificado para CPF
  register: (cpf: string, password: string) => Promise<void>;  // Modificado para apenas CPF e senha
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  removeAvatar: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Inicializa os serviços após autenticação bem-sucedida
  const initializeServices = (userId: string) => {
    try {
      // Inicializar preferências ou carregar dados iniciais
      activitiesService.getAll().catch(err => 
        console.warn('Falha ao pré-carregar atividades:', err)
      );
      
      calendarService.getEvents().catch(err => 
        console.warn('Falha ao pré-carregar eventos:', err)
      );
      
      console.log('Serviços inicializados para o usuário:', userId);
    } catch (error) {
      console.error('Erro ao inicializar serviços:', error);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      if (isAuthenticated()) {
        try {
          const result = await getUserData();
          if (result.success && result.data) {
            // Adaptar o formato de dados do backend para o formato esperado pelo frontend
            const userData = {
              id: result.data._id || result.data.id,
              name: result.data.nome,
              cpf: result.data.cpf, // Adicionado CPF
              email: result.data.email,
			  chapa: result.data.chapa,
              cargo: result.data.cargo,
              department: result.data.departamento,
			  filial: result.data.filial,
              dataAdmissao: result.data.dataAdmissao,
              dataNascimento: result.data.dataNascimento,
              avatar: result.data.avatar,
              roles: result.data.roles,
              permissions: result.data.permissions
            };
            
            setUser(userData);
            
            // Garantir que o ID do usuário está armazenado no localStorage
            if (userData.id) {
              localStorage.setItem('userId', userData.id);
              // Inicializar serviços com o ID do usuário
              initializeServices(userData.id);
            }
          }
        } catch (error) {
          console.error('Erro ao carregar usuário:', error);
          // Se houver erro, podemos limpar o token
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          
          toast({
            title: "Sessão expirada",
            description: "Sua sessão expirou. Por favor, faça login novamente.",
            variant: "destructive"
          });
        }
      }
      setIsLoading(false);
    };
    
    loadUser();
  }, []);

  const login = async (cpf: string, password: string) => {
  setIsLoading(true);
  try {
    // Remover formatação do CPF
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    if (cpfLimpo.length !== 11) {
      throw new Error("CPF inválido. Informe um CPF com 11 dígitos.");
    }
    
    // Garantir que estamos enviando os dados corretos
    const payload = {
      cpf: cpfLimpo,
      senha: password // Usando 'senha' como esperado pelo backend
    };
    
    //console.log('Enviando dados de login:', { cpf: payload.cpf, senha: '******' });
    
    // Fazer a requisição diretamente usando axios ou fetch
    const response = await fetch(`${window.location.origin}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error('Falha na autenticação. Verifique suas credenciais.');
    }
    
    const result = await response.json();
    
    // Adaptar o formato de dados do backend para o formato esperado pelo frontend
    const userData = {
      id: result.usuario.id,
      name: result.usuario.nome,
      cpf: result.usuario.cpf, // Adicionado CPF
      email: result.usuario.email,
	  chapa: result.usuario.chapa,
      cargo: result.usuario.cargo,
      department: result.usuario.departamento,
	  filial: result.usuario.filial,
      dataAdmissao: result.usuario.dataAdmissao,
      dataNascimento: result.usuario.dataNascimento,
      avatar: result.usuario.avatar,
      roles: result.usuario.roles || [],
      permissions: result.usuario.permissions || []
    };
    
    localStorage.setItem('token', result.token);
    localStorage.setItem('userId', result.usuario.id);
    setUser(userData);
    
    toast({
      title: "Login bem-sucedido",
      description: `Bem-vindo, ${result.usuario.nome}!`,
    });
    
    navigate('/');
  } catch (error) {
    console.error('Erro no login:', error);
    
    toast({
      title: "Erro no login",
      description: error instanceof Error ? error.message : "Falha no login. Verifique suas credenciais.",
      variant: "destructive",
    });
    
    throw error;
  } finally {
    setIsLoading(false);
  }
};
  // Função de registro simplificada para CPF e senha
  const register = async (cpf: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await registerUser(cpf, password);
      if (result.success) {
        if (result.data.usuario) {
          const userData = {
            id: result.data.usuario.id || result.data.usuario._id,
            name: result.data.usuario.nome,
            cpf: result.data.usuario.cpf,
            email: result.data.usuario.email,
			chapa: result.data.usuario.chapa,
            cargo: result.data.usuario.cargo,
            department: result.data.usuario.departamento,
			filial: result.data.usuario.filial,
            dataAdmissao: result.data.usuario.dataAdmissao,
            dataNascimento: result.data.usuario.dataNascimento,
            avatar: result.data.usuario.avatar,
            roles: result.data.usuario.roles || [],
            permissions: result.data.usuario.permissions || []
          };
          
          setUser(userData);
          
          // Armazenar o ID do usuário no localStorage
          if (userData.id) {
            localStorage.setItem('userId', userData.id);
            
            // Inicializar serviços após registro bem-sucedido
            initializeServices(userData.id);
          }
          
          toast({
            title: "Registro bem-sucedido",
            description: `Bem-vindo, ${userData.name}!`,
          });
        } else {
          toast({
            title: "Registro realizado",
            description: "Por favor, faça login com suas credenciais.",
          });
          
          navigate('/login');
          return;
        }
        
        navigate('/');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Erro no registro:', error);
      
      toast({
        title: "Erro no registro",
        description: error instanceof Error ? error.message : "Não foi possível completar o registro.",
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Função para verificar autenticação
  const isAuthenticated = () => {
    return !!localStorage.getItem('token');
  };

  // Função de logout
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setUser(null);
    
    toast({
      title: "Logout realizado",
      description: "Você saiu da sua conta com sucesso.",
    });
    
    navigate('/login');
  };
  
  const updateUser = async (data: Partial<User>) => {
    try {
      // Apenas o email pode ser atualizado
      const response = await api.put('/auth/user', {
        email: data.email
      });
      
      setUser(prev => prev ? { ...prev, email: response.email } : null);
      
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Função auxiliar para obter dados do usuário
  const getUserData = async () => {
    try {
      const response = await api.get('/auth/user');
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao obter dados do usuário:', error);
      return { success: false, error };
    }
  };

  // Função auxiliar para login
  const loginUser = async (cpf: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { cpf, senha: password });
      
      if (response && response.token) {
        localStorage.setItem('token', response.token);
        return { success: true, data: response };
      }
      
      return { success: false, message: 'Resposta inválida do servidor' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao fazer login';
      return { success: false, message };
    }
  };

  // Função auxiliar para registro
  const registerUser = async (cpf: string, password: string) => {
    try {
      const response = await api.post('/auth/register', { cpf, senha: password });
      
      if (response && response.token) {
        localStorage.setItem('token', response.token);
        return { success: true, data: response };
      }
      
      return { success: false, message: 'Resposta inválida do servidor' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao registrar';
      return { success: false, message };
    }
  };
  
  const uploadAvatar = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
       // Usar fetch diretamente se api.uploadPut não existir
      const token = localStorage.getItem('token');
      const response = await fetch(`${window.location.origin}/api/auth/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Erro ao fazer upload do avatar');
      }
      
      const result = await response.json();
      
      setUser(prev => prev ? { ...prev, avatar: result.avatar } : null);
      
      toast({
        title: "Avatar atualizado",
        description: "Sua foto de perfil foi atualizada com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao fazer upload do avatar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o avatar.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const removeAvatar = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${window.location.origin}/api/auth/avatar`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao remover avatar');
      }
      
      setUser(prev => prev ? { ...prev, avatar: undefined } : null);
      
      toast({
        title: "Avatar removido",
        description: "Sua foto de perfil foi removida com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao remover avatar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o avatar.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
		updateUser,
		uploadAvatar,
        removeAvatar
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};