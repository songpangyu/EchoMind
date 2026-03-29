import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { clearTokens, getAccessToken, getMe, login as apiLogin, loginWithApple as apiLoginWithApple, logout as apiLogout, register as apiRegister, UserProfile } from '../api/auth';
import { UnauthenticatedError } from '../api/client';

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  loginWithApple: (identityToken: string, firstName?: string | null, lastName?: string | null) => Promise<void>;
  register: (username: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: check if we have a valid token
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const token = await getAccessToken();
        if (token) {
          const profile = await getMe();
          setUser(profile);
        }
      } catch (e) {
        // UnauthenticatedError = no valid token / expired — totally normal, just stay on Login.
        // Any other error = network/corrupt — clear storage for a clean state.
        if (!(e instanceof UnauthenticatedError)) {
          await clearTokens();
        }
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    await apiLogin(identifier, password);
    const profile = await getMe();
    setUser(profile);
  }, []);

  const loginWithApple = useCallback(async (identityToken: string, firstName?: string | null, lastName?: string | null) => {
    await apiLoginWithApple(identityToken, firstName, lastName);
    const profile = await getMe();
    setUser(profile);
  }, []);

  const register = useCallback(async (username: string, password: string, displayName: string) => {
    await apiRegister(username, password, displayName);
    const profile = await getMe();
    setUser(profile);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await getMe();
      setUser(profile);
    } catch {}
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      loginWithApple,
      register,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
