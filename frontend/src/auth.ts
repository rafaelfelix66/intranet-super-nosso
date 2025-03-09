// src/auth.ts
import axios from 'axios';

const API_URL = '/api'; // Proxy via Nginx

export async function loginUser(email: string, password: string) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    localStorage.setItem('token', response.data.token);
    return { success: true, data: response.data };
  } catch (error: any) {
    return { success: false, message: error.response?.data?.mensagem || 'Erro ao fazer login' };
  }
}

export async function registerUser(name: string, email: string, password: string) {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, { name, email, password });
    localStorage.setItem('token', response.data.token);
    return { success: true, data: response.data };
  } catch (error: any) {
    return { success: false, message: error.response?.data?.mensagem || 'Erro ao registrar' };
  }
}

export async function getUserData() {
  const token = localStorage.getItem('token');
  if (!token) return { success: false, message: 'Usuário não autenticado' };
  try {
    const response = await axios.get(`${API_URL}/auth/user`, {
      headers: { 'x-auth-token': token },
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    localStorage.removeItem('token');
    return { success: false, message: error.response?.data?.mensagem || 'Sessão expirada' };
  }
}

export function logoutUser() {
  localStorage.removeItem('token');
}

export function isAuthenticated() {
  return !!localStorage.getItem('token');
}