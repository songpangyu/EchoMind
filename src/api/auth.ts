import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from './client';

const ACCESS_TOKEN_KEY = 'echomind_access_token';
const REFRESH_TOKEN_KEY = 'echomind_refresh_token';

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
  dreams_count: number;
  followers_count: number;
  following_count: number;
}

// ── Token Storage ─────────────────────────────────────────────────────────────

export const saveTokens = async (tokens: TokenPair): Promise<void> => {
  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  await AsyncStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
};

export const getAccessToken = (): Promise<string | null> =>
  AsyncStorage.getItem(ACCESS_TOKEN_KEY);

export const getRefreshToken = (): Promise<string | null> =>
  AsyncStorage.getItem(REFRESH_TOKEN_KEY);

export const clearTokens = async (): Promise<void> => {
  await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
  await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
};

// ── Auth API ──────────────────────────────────────────────────────────────────

export const register = async (
  username: string,
  password: string,
  displayName: string,
): Promise<TokenPair> => {
  const tokens = await apiRequest<TokenPair>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password, display_name: displayName }),
  });
  await saveTokens(tokens);
  return tokens;
};

export const login = async (
  identifier: string,
  password: string,
): Promise<TokenPair> => {
  const tokens = await apiRequest<TokenPair>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });
  await saveTokens(tokens);
  return tokens;
};

export const loginWithApple = async (
  identity_token: string,
  first_name?: string | null,
  last_name?: string | null,
): Promise<TokenPair> => {
  const tokens = await apiRequest<TokenPair>('/auth/apple-login', {
    method: 'POST',
    body: JSON.stringify({ identity_token, first_name, last_name }),
    skipAuth: true,
  });
  await saveTokens(tokens);
  return tokens;
};

export const refreshAccessToken = async (): Promise<string | null> => {
  const refresh_token = await getRefreshToken();
  if (!refresh_token) return null;
  try {
    const tokens = await apiRequest<TokenPair>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token }),
    });
    await saveTokens(tokens);
    return tokens.access_token;
  } catch {
    await clearTokens();
    return null;
  }
};

export const logout = async (): Promise<void> => {
  await clearTokens();
};

export const getMe = (): Promise<UserProfile> =>
  apiRequest<UserProfile>('/auth/me');

export const updateMe = (data: Partial<Pick<UserProfile, 'display_name' | 'bio' | 'avatar_url'>>): Promise<UserProfile> =>
  apiRequest<UserProfile>('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
