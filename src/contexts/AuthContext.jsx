import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        loadUser(session.access_token);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        loadUser(session.access_token);
      } else {
        setUser(null);
        setNeedsOnboarding(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadUser(token) {
    try {
      const { data } = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(data.user);
      setNeedsOnboarding(false);
    } catch (err) {
      if (err.response?.status === 404) {
        setNeedsOnboarding(true);
        setUser(null);
      } else {
        await supabase.auth.signOut();
      }
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  async function onboard(default_currency = 'BRL') {
    const { data: { session: current } } = await supabase.auth.getSession();
    const { data } = await axios.post(
      '/api/auth/onboard',
      { default_currency },
      { headers: { Authorization: `Bearer ${current.access_token}` } }
    );
    setUser(data.user);
    setNeedsOnboarding(false);
    return data.user;
  }

  return (
    <AuthContext.Provider value={{ user, session, token: session?.access_token, loading, needsOnboarding, login, logout, onboard }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
