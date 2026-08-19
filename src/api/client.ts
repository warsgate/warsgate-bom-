// API Base URL - reads from environment variable (set in .env or Render dashboard)
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { ...headers, ...(options?.headers || {}) },
    ...options,
  });
  
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      if (path !== '/auth/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
      }
    }
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ─── Projects ─────────────────────────────────────────────────
export const projectsApi = {
  getAll: () => request<any[]>('/projects'),
  getOne: (id: string) => request<any>(`/projects/${id}`),
  create: (data: any) => request<any>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<any>(`/projects/${id}`, { method: 'DELETE' }),
};

// ─── Modules ──────────────────────────────────────────────────
export const modulesApi = {
  getAll: (projectId?: string) => request<any[]>(`/modules${projectId ? `?projectId=${projectId}` : ''}`),
  getOne: (id: string) => request<any>(`/modules/${id}`),
  create: (data: any) => request<any>('/modules', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/modules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<any>(`/modules/${id}`, { method: 'DELETE' }),
};

// ─── Parts ────────────────────────────────────────────────────
export const partsApi = {
  getAll: (projectId?: string, moduleId?: string) => {
    const params = new URLSearchParams();
    if (projectId) params.set('projectId', projectId);
    if (moduleId) params.set('moduleId', moduleId);
    return request<any[]>(`/parts${params.toString() ? `?${params}` : ''}`);
  },
  getOne: (id: string) => request<any>(`/parts/${id}`),
  create: (data: any) => request<any>('/parts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/parts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<any>(`/parts/${id}`, { method: 'DELETE' }),
  bulkImport: (parts: any[]) => request<any>('/parts/bulk', { method: 'POST', body: JSON.stringify({ parts }) }),
};

// ─── Master Tasks ─────────────────────────────────────────────
export const masterTasksApi = {
  getAll: (projectId?: string) => request<any[]>(`/master-tasks${projectId ? `?projectId=${projectId}` : ''}`),
  getOne: (id: string) => request<any>(`/master-tasks/${id}`),
  create: (data: any) => request<any>('/master-tasks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/master-tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateBatch: (tasks: any[]) => request<any[]>('/master-tasks/batch', { method: 'PUT', body: JSON.stringify({ tasks }) }),
  delete: (id: string) => request<any>(`/master-tasks/${id}`, { method: 'DELETE' }),
};

// ─── Master Parts ─────────────────────────────────────────────
export const masterPartsApi = {
  getAll: () => request<any[]>('/master-parts'),
  getOne: (id: string) => request<any>(`/master-parts/${id}`),
  create: (data: any) => request<any>('/master-parts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/master-parts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<any>(`/master-parts/${id}`, { method: 'DELETE' }),
  sync: () => request<any>('/master-parts/sync', { method: 'POST' }),
};

// ─── Quotations ───────────────────────────────────────────────
export const quotationsApi = {
  getAll: (projectId?: string) => request<any[]>(`/quotations${projectId ? `?projectId=${projectId}` : ''}`),
  getOne: (id: string) => request<any>(`/quotations/${id}`),
  create: (data: any) => request<any>('/quotations', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/quotations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<any>(`/quotations/${id}`, { method: 'DELETE' }),
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const res = await fetch(`${BASE_URL}/quotations/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      const errMsg = errData?.details || errData?.error || 'File upload failed';
      throw new Error(errMsg);
    }
    return res.json();
  }
};

// ─── Users (Admin Only) ───────────────────────────────────────
export const usersApi = {
  getAll: () => request<any[]>('/auth/users'),
  create: (data: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/auth/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<any>(`/auth/users/${id}`, { method: 'DELETE' }),
};
