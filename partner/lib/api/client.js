// PATH: lib/api/client.js

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1343/api';

class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
    this.timeout = 30000;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('partner_auth_token');
    }
  }

  setToken(token) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem('partner_auth_token', token);
      else localStorage.removeItem('partner_auth_token');
    }
  }

  getToken() {
    return this.token;
  }

  clearToken() {
    this.setToken(null);
  }

  async request(endpoint, options = {}) {
    const { timeout = this.timeout, ...requestOptions } = options;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(requestOptions.headers || {}),
      },
      ...requestOptions,
    };

    if (this.token) config.headers['Authorization'] = `Bearer ${this.token}`;

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    config.signal = controller.signal;

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        if (response.status === 401) {
          this.clearToken();
          if (typeof window !== 'undefined') window.location.href = '/login';
        }
        const apiError = new Error(error.message || error.error?.message || 'Request failed');
        apiError.status = response.status;
        apiError.response = error;
        throw apiError;
      }

      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        const e = new Error('Request timeout');
        e.isTimeout = true;
        throw e;
      }
      throw error;
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  async upload(endpoint, formData) {
    const headers = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
    return response.json();
  }
}

export const apiClient = new APIClient();
export default APIClient;
