// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser, getUserData, logoutUser, isAuthenticated } from '../auth';

interface User {
  id: string;
  nome: string;
  email: string;
  cargo?: string;
  departamento?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
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
        const result = await getUserData();
        if (result.success) {
          setUser(result.data);
          // Garantir que o ID do usuário está armazenado no localStorage
          if (result.data && result.data.id) {
            localStorage.setItem('userId', result.data.id);
          }
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
        setUser(result.data.usuario);
        
        // Armazenar o ID do usuário no localStorage
        if (result.data.usuario && result.data.usuario.id) {
          localStorage.setItem('userId', result.data.usuario.id);
          console.log('ID do usuário armazenado:', result.data.usuario.id);
        }
        
        navigate('/');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await registerUser(name, email, password);
      if (result.success) {
        setUser(result.data.usuario);
        
        // Armazenar o ID do usuário no localStorage
        if (result.data.usuario && result.data.usuario.id) {
          localStorage.setItem('userId', result.data.usuario.id);
        }
        
        navigate('/');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    logoutUser();
    localStorage.removeItem('userId'); // Remover o ID do usuário
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