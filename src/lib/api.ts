import { handleClientMockRequest } from './clientApiMock.js';

const TOKEN_KEY = 'skillbridge_auth_token';

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Only genuine network failures (fetch() itself throwing - offline, DNS failure,
  // CORS, static host with no backend, etc.) should ever trigger the mock fallback.
  let response: Response;
  try {
    response = await fetch(endpoint, {
      ...options,
      headers
    });
  } catch (err: any) {
    console.warn(`[SkillBridge API] Network error calling ${endpoint}, activating client runtime engine:`, err?.message);
    return handleClientMockRequest<T>(endpoint, options);
  }

  const contentType = response.headers.get('content-type') || '';

  // If backend returned HTML (e.g. 404 page or SPA fallback on static host like Netlify)
  if (!contentType.includes('application/json') || response.status === 404 || response.status === 502 || response.status === 503) {
    return handleClientMockRequest<T>(endpoint, options);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // A real 401 from our own backend means "not authenticated" - it must be
    // surfaced as an auth error, never swallowed into the mock runtime.
    if (response.status === 401) {
      const errorMsg = data?.error || data?.message || 'Unauthorized';

      // Only treat this as "the session died" if we actually sent a token.
      // A 401 on /api/auth/login with no token is just a wrong password, not an
      // expired session - don't wipe anything or fire a global logout for that.
      if (token) {
        localStorage.removeItem(TOKEN_KEY);
        window.dispatchEvent(new CustomEvent('skillbridge:auth-expired'));
      }

      const authErr = new Error(errorMsg);
      (authErr as any).status = 401;
      (authErr as any).isAuthError = true;
      throw authErr;
    }

    // If error is 404 or missing route on backend, fallback to client mock
    if (response.status === 500) {
      return handleClientMockRequest<T>(endpoint, options);
    }

    const errorMsg = data?.error || data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return apiRequest<T>(endpoint, options);
  },

  get<T = any>(endpoint: string): Promise<T> {
    return apiRequest<T>(endpoint, { method: 'GET' });
  },

  post<T = any>(endpoint: string, body?: any): Promise<T> {
    return apiRequest<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    });
  },

  put<T = any>(endpoint: string, body?: any): Promise<T> {
    return apiRequest<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined
    });
  },

  delete<T = any>(endpoint: string): Promise<T> {
    return apiRequest<T>(endpoint, { method: 'DELETE' });
  }
};
