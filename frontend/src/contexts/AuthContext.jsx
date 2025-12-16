import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, getCurrentUser } from '../services/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  // Load user on mount and check token expiration
  useEffect(() => {
    if (token) {
      const tokenExpiry = localStorage.getItem('tokenExpiry');
      if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
        // Token expired
        logout();
      } else {
        loadUser();
      }
    } else {
      setLoading(false);
    }
  }, [token]);

  async function loadUser() {
    try {
      const userData = await getCurrentUser(token);
      setUser(userData);
    } catch (error) {
      console.error('Failed to load user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password, rememberMe = false) {
    const { token: newToken, user: userData } = await apiLogin(email, password);
    localStorage.setItem('token', newToken);

    // Set token expiry based on rememberMe
    if (rememberMe) {
      // 7 days in milliseconds
      const expiryTime = Date.now() + (7 * 24 * 60 * 60 * 1000);
      localStorage.setItem('tokenExpiry', expiryTime.toString());
    } else {
      // Session only - expires when browser closes
      localStorage.removeItem('tokenExpiry');
    }

    setToken(newToken);
    setUser(userData);
  }

  async function register(email, password) {
    const { token: newToken, user: userData } = await apiRegister(email, password);
    localStorage.setItem('token', newToken);
    // Default to session only for new registrations
    localStorage.removeItem('tokenExpiry');
    setToken(newToken);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
