const API_BASE_URL = 'https://echomind.ulme.cn/api/v1';
const NETWORK_RETRY_DELAY_MS = 350;

type RequestOptions = RequestInit & {
  query?: Record<string, string | number | boolean | undefined | null>;
};

const buildUrl = (path: string, query?: RequestOptions['query']) => {
  const rawPath = path.startsWith('/') ? path : `/${path}`;
  const normalizedPath = rawPath === '/' ? rawPath : rawPath.replace(/\/+$/, '');
  const url = new URL(`${API_BASE_URL}${normalizedPath}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }
      url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { query, headers, body, ...rest } = options;
  const url = buildUrl(path, query);
  const requestInit: RequestInit = {
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body,
  };

  const makeRequest = async () => {
    const response = await fetch(url, requestInit);
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
      const detail = data?.detail || `Request failed with status ${response.status}`;
      throw new Error(detail);
    }

    return data as T;
  };

  try {
    return await makeRequest();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isNetworkError = /network request failed/i.test(message);

    if (__DEV__) {
      console.log('[apiRequest]', requestInit.method ?? 'GET', url);
      console.log('[apiRequest:error]', message);
    }

    if (!isNetworkError) {
      throw error;
    }

    await new Promise<void>(resolve => {
      setTimeout(resolve, NETWORK_RETRY_DELAY_MS);
    });

    try {
      return await makeRequest();
    } catch (retryError) {
      if (__DEV__) {
        const retryMessage = retryError instanceof Error ? retryError.message : String(retryError);
        console.log('[apiRequest:retry-error]', retryMessage);
      }
      throw retryError;
    }
  }
}

export { API_BASE_URL };
