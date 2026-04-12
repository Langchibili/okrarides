// lib/api/adminClient.js
// Central API client for admin panel – wraps fetch with auth token handling

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1343/api';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_auth_token') || localStorage.getItem('auth_token');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
    const e = new Error(err.error?.message || err.message || 'Request failed');
    e.status = res.status;
    throw e;
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const adminClient = {
  get:    (url, opts = {}) => request(url, { ...opts, method: 'GET' }),
  post:   (url, body, opts = {}) => request(url, { ...opts, method: 'POST', body: JSON.stringify(body) }),
  put:    (url, body, opts = {}) => request(url, { ...opts, method: 'PUT', body: JSON.stringify(body) }),
  patch:  (url, body, opts = {}) => request(url, { ...opts, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (url, opts = {}) => request(url, { ...opts, method: 'DELETE' }),
};

// Build a Strapi query string from an object
export function buildQuery(params = {}) {
  const q = new URLSearchParams();
  if (params.page)     q.set('pagination[page]', params.page);
  if (params.pageSize) q.set('pagination[pageSize]', params.pageSize);
  if (params.sort)     q.set('sort', params.sort);
  if (params.search && params.searchField)
    q.set(`filters[${params.searchField}][$containsi]`, params.search);
  if (params.populate)
    [].concat(params.populate).forEach((p, i) => q.set(`populate[${i}]`, p));
  if (params.filters) {
    Object.entries(params.filters).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined)
        q.set(`filters[${k}][$eq]`, v);
    });
  }
  return q.toString() ? `?${q}` : '';
}

export default adminClient;