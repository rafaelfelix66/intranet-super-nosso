// src/services/api.ts
const API_BASE_URL = 'http://127.0.0.1:3000/api';

export const api = {
  get: async (endpoint: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status}`);
    }
    
    return response.json();
  },
  
  post: async (endpoint: string, data: any, isFormData = false) => {
    const token = localStorage.getItem('token');
    
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
      console.error(`Erro na requisição: ${response.status}`, errorText);
      throw new Error(`Erro na requisição: ${response.status}`);
    }
    
    return response.json();
  },
  
  put: async (endpoint: string, data = {}) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status}`);
    }
    
    return response.json();
  }
};