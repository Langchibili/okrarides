const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1343/api').replace(/\/+$/, '');
const SERVER_BASE = API_BASE.replace(/\/api$/, '');
const ADMIN_BASE = `${SERVER_BASE}/admin`;
const TOKEN_KEY = 'admn_admin_jwt';

function getToken() {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  if (typeof window === 'undefined') return;
  if (token) window.sessionStorage.setItem(TOKEN_KEY, token);
  else window.sessionStorage.removeItem(TOKEN_KEY);
}

function appendQuery(endpoint, params) {
  if (!params || typeof params !== 'object' || params instanceof URLSearchParams) {
    if (params instanceof URLSearchParams && params.toString()) {
      return `${endpoint}${endpoint.includes('?') ? '&' : '?'}${params.toString()}`;
    }
    return endpoint;
  }

  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) value.forEach(item => query.append(key, String(item)));
    else query.set(key, String(value));
  });
  const serialized = query.toString();
  return serialized ? `${endpoint}${endpoint.includes('?') ? '&' : '?'}${serialized}` : endpoint;
}

function getUrl(endpoint) {
  if (endpoint.startsWith('/admin/')) return `${ADMIN_BASE}${endpoint.slice('/admin'.length)}`;
  if (endpoint === '/roles' || endpoint.startsWith('/roles?')) {
    return `${ADMIN_BASE}${endpoint}`;
  }
  const adminEndpoint = endpoint.startsWith('/admn') ? endpoint : `/admn${endpoint}`;
  return `${SERVER_BASE}${adminEndpoint}`;
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = { Accept: 'application/json', ...(options.headers || {}) };
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (options.body !== undefined && !isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  if (token && !endpoint.startsWith('/admin/login')) headers.Authorization = `Bearer ${token}`;

  const { query, ...fetchOptions } = options;
  const url = getUrl(appendQuery(endpoint, query));
  const response = await fetch(url, { ...fetchOptions, headers });
  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      const contentType = response.headers.get('content-type') || 'an unknown content type';
      const error = new Error(`Admin API returned an invalid response for ${endpoint} (${contentType})`);
      error.status = response.status;
      throw error;
    }
  }

  if (!response.ok) {
    const error = new Error(
      payload?.error?.message ||
      payload?.message ||
      `Request failed with status ${response.status}`
    );
    error.status = response.status;
    throw error;
  }

  return payload;
}

async function get(endpoint, params) {
  return request(appendQuery(endpoint, params));
}

async function send(method, endpoint, body, options = {}) {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  return request(endpoint, {
    ...options,
    method,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });
}

export const adminClient = {
  get,
  post: (endpoint, body, options) => send('POST', endpoint, body, options),
  put: (endpoint, body, options) => send('PUT', endpoint, body, options),
  patch: (endpoint, body, options) => send('PATCH', endpoint, body, options),
  upload: (endpoint, body, options) => send('POST', endpoint, body, options),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
  login: async (email, password) => {
    const payload = await request('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      headers: { 'Content-Type': 'application/json' },
    });
    const token = payload?.data?.token || payload?.token;
    if (!token) throw new Error('Strapi Admin login did not return an access token');
    setToken(token);
    return payload?.data?.user || payload?.user || null;
  },
  logout: () => setToken(null),
  hasToken: () => Boolean(getToken()),
};

export function buildQuery(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('pagination[page]', params.page);
  if (params.pageSize) query.set('pagination[pageSize]', params.pageSize);
  if (params.sort) query.set('sort', params.sort);
  if (params.search && params.searchField) {
    query.set(`filters[${params.searchField}][$containsi]`, params.search);
  }
  if (params.populate) {
    [].concat(params.populate).forEach((value, index) => query.set(`populate[${index}]`, value));
  }
  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        query.set(`filters[${key}][$eq]`, value);
      }
    });
  }
  return query.toString();
}

export default adminClient;
