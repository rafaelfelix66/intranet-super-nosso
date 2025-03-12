// src/services/api.ts
// src/services/api.ts - Versão atualizada

// Detectar automaticamente o ambiente e usar o host adequado
const getBaseUrl = () => {
  // Em produção, usamos o proxy configurado no nginx
  if (window.location.hostname !== 'localhost') {
    return '/api';
  }
  
  // Em desenvolvimento local, conectamos diretamente ao backend
  return 'http://localhost:3000/api';
};

const API_BASE_URL = getBaseUrl();

export const api = {
  get: async (endpoint: string) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro ${response.status}:`, errorText);
        throw new Error(`Erro na requisição: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Erro na requisição GET:', error);
      throw error;
    }
  },
  
  post: async (endpoint: string, data: any, isFormData = false) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    try {
      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`
      };
      
      if (!isFormData) {
        headers['Content-Type'] = 'application/json';
      }
      
      const body = isFormData ? data : JSON.stringify(data);
      
      console.log(`Enviando para ${API_BASE_URL}${endpoint}:`, 
        isFormData ? 'FormData content' : data);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro ${response.status}:`, errorText);
        throw new Error(`Erro na requisição: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Erro na requisição POST:', error);
      throw error;
    }
  },
  
  put: async (endpoint: string, data = {}) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro ${response.status}:`, errorText);
        throw new Error(`Erro na requisição: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Erro na requisição PUT:', error);
      throw error;
    }
  },
  
  delete: async (endpoint: string) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro ${response.status}:`, errorText);
        throw new Error(`Erro na requisição: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Erro na requisição DELETE:', error);
      throw error;
    }
  },
  
  upload: async (endpoint: string, formData: FormData) => {
    return api.post(endpoint, formData, true);
  }
};