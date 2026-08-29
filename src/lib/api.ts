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

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers
    });

    const contentType = response.headers.get('content-type') || '';
    
    // If backend returned HTML (e.g. 404 page or SPA fallback on static host like Netlify)
    if (!contentType.includes('application/json') || response.status === 404 || response.status === 502 || response.status === 503) {
      return handleClientMockRequest<T>(endpoint, options);
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      // If error is 404 or missing route on backend, fallback to client mock
      if (response.status === 404 || response.status === 500) {
        try {
          return handleClientMockRequest<T>(endpoint, options);
        } catch {
          // Continue to throw error
        }
      }
      const errorMsg = data?.error || data?.message || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data as T;
  } catch (err: any) {
    // If fetch failed completely (network disconnected, offline, or static deployment without backend)
    console.warn(`[SkillBridge API] Network error calling ${endpoint}, activating client runtime engine:`, err?.message);
    try {
      return handleClientMockRequest<T>(endpoint, options);
    } catch (fallbackErr) {
      throw err;
    }
  }
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
