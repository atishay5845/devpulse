import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/endpoints';
import { TOKEN_KEYS } from '../api/client';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEYS.access);
    sessionStorage.removeItem(TOKEN_KEYS.refresh);
    setUser(null);
  }, []);

  const loadUser = useCallback(async () => {
    const token = sessionStorage.getItem(TOKEN_KEYS.access);
    if (!token) { setLoading(false); return; }
    try {
      const response = await authApi.me();
      setUser(response.data);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => { loadUser(); }, [loadUser]);
  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener('devpulse:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('devpulse:unauthorized', handleUnauthorized);
  }, [logout]);

  const login = useCallback(async (username, password) => {
    const response = await authApi.login({ username, password });
    sessionStorage.setItem(TOKEN_KEYS.access, response.data.access);
    sessionStorage.setItem(TOKEN_KEYS.refresh, response.data.refresh);
    const me = await authApi.me();
    setUser(me.data);
    return me.data;
  }, []);

  const register = useCallback(async (payload) => {
    await authApi.register(payload);
    return login(payload.username, payload.password);
  }, [login]);

  const value = useMemo(() => ({ user, loading, login, register, logout, refreshUser: loadUser }), [user, loading, login, register, logout, loadUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
