import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://echomind.ulme.cn/api/v1';
const NETWORK_RETRY_DELAY_MS = 350;

const ACCESS_TOKEN_KEY = 'echomind_access_token';
const REFRESH_TOKEN_KEY = 'echomind_refresh_token';

// Sentinel error — means "definitely not logged in", not a real server error
export class UnauthenticatedError extends Error {
  constructor() { super('UNAUTHENTICATED'); this.name = 'UnauthenticatedError'; }
}

type RequestOptions = RequestInit & {
  query?: Record<string, string | number | boolean | undefined | null>;
  skipAuth?: boolean; // set true for login/register endpoints
};

const buildUrl = (path: string, query?: RequestOptions['query']) => {
  const rawPath = path.startsWith('/') ? path : `/${path}`;
  const normalizedPath = rawPath === '/' ? rawPath : rawPath.replace(/\/+$/, '');
  const base = `${API_BASE_URL}${normalizedPath}`;

  if (!query) return base;

  const qs = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

  return qs ? `${base}?${qs}` : base;
};

async function getStoredToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

async function refreshTokens(): Promise<string | null> {
  try {
    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return null;

    const url = buildUrl('/auth/refresh');
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) {
      await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      return null;
    }
    const data = await res.json();
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
    return data.access_token as string;
  } catch {
    return null;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { query, headers, body, skipAuth, ...rest } = options;
  const url = buildUrl(path, query);

  const buildHeaders = async (token?: string | null): Promise<Record<string, string>> => {
    const h: Record<string, string> = {
      Accept: 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...(body && typeof FormData !== 'undefined' && body instanceof FormData ? {} : body ? { 'Content-Type': 'application/json' } : {}),
      ...(headers as Record<string, string> | undefined),
    };
    if (!skipAuth && token) {
      h['Authorization'] = `Bearer ${token}`;
    }
    return h;
  };

  const makeRequest = async (token?: string | null): Promise<T> => {
    const requestInit: RequestInit = {
      ...rest,
      headers: await buildHeaders(token),
      body,
    };

    if (__DEV__) {
      console.log('[apiRequest]', requestInit.method ?? 'GET', url);
    }

    const response = await fetch(url, requestInit);
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
      const detail = data?.detail || `Request failed with status ${response.status}`;
      const err = new Error(detail) as Error & { status?: number };
      err.status = response.status;
      throw err;
    }

    return data as T;
  };

  // Try with the current access token first
  const token = skipAuth ? null : await getStoredToken();

  try {
    return await makeRequest(token);
  } catch (error) {
    const err = error as Error & { status?: number };

    // 401 → try to refresh token once
    if (!skipAuth && err.status === 401) {
      const newToken = await refreshTokens();
      if (newToken) {
        try {
          return await makeRequest(newToken);
        } catch (retryError) {
          throw retryError;
        }
      }
      // No refresh token / refresh failed — throw quiet sentinel (not backend message)
      throw new UnauthenticatedError();
    }

    // Network error → retry once after delay
    const isNetworkError = /network request failed/i.test(err.message);
    if (isNetworkError) {
      await new Promise<void>(resolve => setTimeout(resolve, NETWORK_RETRY_DELAY_MS));
      return await makeRequest(token);
    }

    if (__DEV__) {
      console.log('[apiRequest:error]', err.message);
    }
    throw error;
  }
}

export { API_BASE_URL };
