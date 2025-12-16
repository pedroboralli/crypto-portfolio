import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function register(email, password) {
  const response = await axios.post(`${API_URL}/api/auth/register`, {
    email,
    password
  });
  return response.data;
}

export async function login(email, password, rememberMe = false) {
  const response = await axios.post(`${API_URL}/api/auth/login`, {
    email,
    password,
    rememberMe
  });
  return response.data;
}

export async function getCurrentUser(token) {
  const response = await axios.get(`${API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data.user;
}
