// src/contexts/AuthContext.tsx - Versão completa atualizada

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser, getUserData, logoutUser, isAuthenticated } from '../auth';

interface User {
  id: string;
  name: string;
  email: string;
  department?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, cargo?: string, departamento?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      if (isAuthenticated()) {
        try {
          const result = await getUserData();
          if (result.success && result.data) {
            // Adaptar o formato de dados do backend para o formato esperado pelo frontend
            setUser({
              id: result.data._id,
              name: result.data.nome,
              email: result.data.email,
              department: result.data.departamento,
              avatar: result.data.avatar
            });
            
            // Garantir que o ID do usuário está armazenado no localStorage
            if (result.data._id) {
              localStorage.setItem('userId', result.data._id);
            }
          }
        } catch (error) {
          console.error('Erro ao carregar usuário:', error);
          // Se houver erro, podemos limpar o token
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
        }
      }
      setIsLoading(false);
    };
    
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await loginUser(email, password);
      if (result.success) {
        // Adaptar o formato de dados do backend para o formato esperado pelo frontend
        setUser({
          id: result.data.usuario.id,
          name: result.data.usuario.nome,
          email: result.data.usuario.email,
          department: result.data.usuario.departamento,
          avatar: result.data.usuario.avatar
        });
        
        // Armazenar o ID do usuário no localStorage
        if (result.data.usuario.id) {
          localStorage.setItem('userId', result.data.usuario.id);
          console.log('ID do usuário armazenado:', result.data.usuario.id);
        }
        
        navigate('/');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, cargo: string = '', departamento: string = '') => {
    setIsLoading(true);
    try {
      const result = await registerUser(name, email, password, cargo, departamento);
      if (result.success) {
        // Se o backend retornar informações do usuário, podemos usá-las
        if (result.data.usuario) {
          setUser({
            id: result.data.usuario.id,
            name: result.data.usuario.nome || name,
            email: result.data.usuario.email || email,
            department: result.data.usuario.departamento || departamento,
            avatar: result.data.usuario.avatar
          });
          
          // Armazenar o ID do usuário no localStorage
          if (result.data.usuario.id) {
            localStorage.setItem('userId', result.data.usuario.id);
          }
        } else {
          // Se o backend não retornar info do usuário, precisamos fazer uma requisição getUserData
          // ou navegar para o login para que o usuário faça login
          navigate('/login');
          return;
        }
        
        navigate('/');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Erro no registro:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    logoutUser();
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout
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