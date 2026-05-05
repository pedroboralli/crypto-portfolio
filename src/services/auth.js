import axios from 'axios';

export async function register(email, password) {
  const response = await axios.post('/api/auth/register', { email, password });
  return response.data;
}

export async function login(email, password, rememberMe = false) {
  const response = await axios.post('/api/auth/login', { email, password, rememberMe });
  return response.data;
}

export async function getCurrentUser(token) {
  const response = await axios.get('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.user;
}
