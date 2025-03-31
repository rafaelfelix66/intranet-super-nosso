// src/services/api.ts
// Para melhorar o tratamento de uploads e configuração de cabeçalhos

// Detectar automaticamente o ambiente e usar o host adequado
export const getBaseUrl = () => {
  // Em produção, usamos o proxy configurado no nginx
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return '/api';
  }
  
  // Em desenvolvimento local, conectamos diretamente ao backend
  return 'http://localhost:3000/api';
};

const API_BASE_URL = getBaseUrl();

export const api = {
  getBaseUrl,
  
  get: async (endpoint: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Accept': 'application/json'
      };
      
      // Adicionar token se disponível (alguns endpoints podem ser públicos)
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers
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
  
  put: async (endpoint: string, data: any = {}, isFormData = false) => {
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
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
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
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Usuário não autenticado');
  }
  
  try {
    console.log(`Enviando upload para ${API_BASE_URL}${endpoint}`);
    
    // Log mais detalhado do FormData
    console.log('FormData contém:', [...formData.entries()].map(e => `${e[0]}: ${e[1] instanceof File ? `File (${e[1].name}, ${e[1].size} bytes)` : e[1]}`));
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Não definir Content-Type, deixar o navegador definir com o boundary
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro ${response.status}:`, errorText);
      throw new Error(`Erro na requisição: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Erro na requisição de upload:', error);
    throw error;
  }
},

	uploadPut: async (endpoint: string, formData: FormData) => {
	  const token = localStorage.getItem('token');
	  
	  if (!token) {
		throw new Error('Usuário não autenticado');
	  }
	  
	  try {
		console.log(`Enviando upload PUT para ${API_BASE_URL}${endpoint}`);
		console.log('FormData contém arquivos:', formData.getAll('image').length);
		
		const response = await fetch(`${API_BASE_URL}${endpoint}`, {
		  method: 'PUT',  // Mudamos para PUT
		  headers: {
			'Authorization': `Bearer ${token}`
			// Não definimos Content-Type aqui
		  },
		  body: formData
		});
		
		if (!response.ok) {
		  const errorText = await response.text();
		  console.error(`Erro ${response.status}:`, errorText);
		  throw new Error(`Erro no upload: ${response.status}`);
		}
		
		return response.json();
	  } catch (error) {
		console.error('Erro na requisição de upload:', error);
		throw error;
	  }
	},
  
  // Funções específicas para banners
  banners: {
    getAll: async () => {
      return api.get('/banners/all');
    },
    
    getActive: async () => {
      return api.get('/banners');
    },
    
    create: async (formData: FormData) => {
      return api.upload('/banners', formData);
    },
    
    update: async (id: string, formData: FormData) => {
      // Para PUT com FormData usando a função upload modificada
      const response = await fetch(`${API_BASE_URL}/banners/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro ${response.status}:`, errorText);
        throw new Error(`Erro na atualização do banner: ${response.status}`);
      }
      
      return response.json();
    },
    
    delete: async (id: string) => {
      return api.delete(`/banners/${id}`);
    },
    
    changeOrder: async (id: string, newOrder: number) => {
      return api.put(`/banners/${id}`, { order: newOrder });
    },
    
    toggleActive: async (id: string, isActive: boolean) => {
      return api.put(`/banners/${id}`, { active: isActive });
    }
  }
};