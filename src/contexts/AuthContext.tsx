import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { NativeModules, Platform } from 'react-native';
import { clearTokens, getAccessToken, getRefreshToken, getMe, login as apiLogin, logout as apiLogout, register as apiRegister, UserProfile } from '../api/auth';
import { UnauthenticatedError } from '../api/client';

// Native bridge for syncing JWT tokens to Apple Watch
const { WatchTokenBridge } = NativeModules;

/** Push current tokens to the paired Apple Watch (no-op on Android) */
const syncTokensToWatch = async () => {
  if (Platform.OS !== 'ios' || !WatchTokenBridge) return;
  try {
    const accessToken = await getAccessToken();
    const refreshToken = await getRefreshToken();
    if (accessToken && refreshToken) {
      WatchTokenBridge.syncTokens(accessToken, refreshToken);
    }
  } catch (e) {
    // Non-critical — Watch sync failure should never block the app
    console.log('[AuthContext] Watch token sync failed:', e);
  }
};

/** Tell the paired Apple Watch to clear its stored tokens */
const clearWatchTokens = () => {
  if (Platform.OS !== 'ios' || !WatchTokenBridge) return;
  try {
    WatchTokenBridge.clearTokens();
  } catch (e) {
    console.log('[AuthContext] Watch token clear failed:', e);
  }
};

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<void>;

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
          // Sync tokens to Apple Watch on app launch
          syncTokensToWatch();
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
    // Sync tokens to paired Apple Watch
    syncTokensToWatch();
  }, []);



  const register = useCallback(async (username: string, password: string, displayName: string) => {
    await apiRegister(username, password, displayName);
    const profile = await getMe();
    setUser(profile);
    // Sync tokens to paired Apple Watch
    syncTokensToWatch();
  }, []);

  const logout = useCallback(async () => {
    // Clear tokens on Apple Watch before local cleanup
    clearWatchTokens();
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
