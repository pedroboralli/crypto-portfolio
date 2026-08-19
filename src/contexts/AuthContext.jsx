import { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/auth';

const AuthContext = createContext();
const TOKEN_KEY = 'auth_token';

const MAX_RETRY_DELAY_MS = 30000;
const BASE_RETRY_DELAY_MS = 2000;

/**
 * Só 401/403 significam "esta sessão não vale mais". Timeout, queda de rede e
 * 5xx são problemas temporários: derrubar o usuário neles fazia a sessão cair
 * (e o dashboard ficar vazio) a cada soluço do servidor.
 */
function isSessionInvalid(error) {
  const status = error?.response?.status;
  return status === 401 || status === 403;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);
  // Sessão preservada, mas o servidor não respondeu: o app mostra "reconectando"
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let retryTimer = null;
    let attempt = 0;

    async function loadUser() {
      try {
        const currentUser = await authService.getCurrentUser(token);
        if (cancelled) return;
        setUser(currentUser);
        setAuthError(null);
        setLoading(false);
      } catch (error) {
        if (cancelled) return;

        if (isSessionInvalid(error)) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
          setAuthError(null);
          setLoading(false);
          return;
        }

        // Mantém o token e tenta de novo com espera crescente
        setAuthError('temporary');
        setLoading(false);
        attempt += 1;
        const delay = Math.min(MAX_RETRY_DELAY_MS, BASE_RETRY_DELAY_MS * 2 ** (attempt - 1));
        retryTimer = setTimeout(loadUser, delay);
      }
    }

    loadUser();

    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
    };
  }, [token]);

  async function login(email, password, rememberMe = false) {
    const { token: newToken, user: newUser } = await authService.login(email, password, rememberMe);
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
    setAuthError(null);
  }

  async function register(email, password) {
    const { token: newToken, user: newUser } = await authService.register(email, password);
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
    setAuthError(null);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setAuthError(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, authError, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
