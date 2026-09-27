import {
  DashboardKPIs, MaterialListItem, MaterialDetail, MaterialMatch,
  TechnicalConflict, CommonMaterial, ProcurementOpportunity,
  AuditLog, SearchBeforeCreateResponse, CPSEOrg, User
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function fetchJSON<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    let errMessage = `Error ${res.status}: ${res.statusText}`;
    try {
      const errData = await res.json();
      if (errData && errData.detail) {
        errMessage = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errMessage);
  }
  return res.json();
}

export const api = {
  // Health
  getHealth: () => fetchJSON<{ status: string; service: string }>('/health'),

  // Auth
  login: (email: string, password: string = 'demo123') =>
    fetchJSON<{ access_token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  getDemoUsers: () => fetchJSON<User[]>('/api/auth/demo-users'),

  // Dashboard
  getDashboardKPIs: () => fetchJSON<DashboardKPIs>('/api/dashboard/kpis'),

  // CPSEs
  getCPSES: () => fetchJSON<CPSEOrg[]>('/api/cpses'),

  // Materials
  getMaterials: (params: { cpse_code?: string; category?: string; status?: string; search?: string; min_quality?: number; limit?: number; offset?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.cpse_code) q.set('cpse_code', params.cpse_code);
    if (params.category) q.set('category', params.category);
    if (params.status) q.set('status', params.status);
    if (params.search) q.set('search', params.search);
    if (params.min_quality !== undefined) q.set('min_quality', String(params.min_quality));
    if (params.limit) q.set('limit', String(params.limit));
    if (params.offset) q.set('offset', String(params.offset));
    return fetchJSON<{ total: number; limit: number; offset: number; items: MaterialListItem[] }>(`/api/materials?${q.toString()}`);
  },

  getMaterialDetail: (id: number) => fetchJSON<MaterialDetail>(`/api/materials/${id}`),

  createMaterial: (data: any) =>
    fetchJSON<{ message: string; id: number; material_code: string }>('/api/materials', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Search-Before-Create
  searchBeforeCreate: (description: string, category?: string) =>
    fetchJSON<SearchBeforeCreateResponse>('/api/materials/search-before-create', {
      method: 'POST',
      body: JSON.stringify({ description, category })
    }),

  // AI Matching
  runMatching: (sector: string = 'oil_and_gas') =>
    fetchJSON<{ status: string; new_matches_identified: number; new_conflicts_flagged: number }>(`/api/matching/run?sector=${sector}`, {
      method: 'POST'
    }),

  getMatches: (params: { relationship_type?: string; decision?: string; limit?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.relationship_type) q.set('relationship_type', params.relationship_type);
    if (params.decision) q.set('decision', params.decision);
    if (params.limit) q.set('limit', String(params.limit));
    return fetchJSON<{ total: number; items: MaterialMatch[] }>(`/api/matches?${q.toString()}`);
  },

  reviewMatch: (id: number, decision: string, override_reason?: string, comments?: string) =>
    fetchJSON<{ message: string; decision: string }>(`/api/matches/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ decision, override_reason, comments })
    }),

  // Technical Conflicts
  getConflicts: () => fetchJSON<TechnicalConflict[]>('/api/conflicts'),

  // CNMC Catalog
  getCommonMaterials: () => fetchJSON<CommonMaterial[]>('/api/common-materials'),

  // Legacy Codes
  getLegacyCodes: () => fetchJSON<any[]>('/api/legacy-codes'),
  updateLegacyAction: (id: number, action: string, notes?: string) => {
    const formData = new FormData();
    formData.append('action', action);
    if (notes) formData.append('notes', notes);
    return fetch(`${API_BASE}/api/legacy-codes/${id}/action`, {
      method: 'POST',
      body: formData
    }).then(r => r.json());
  },

  // Procurement
  getProcurementOpportunities: () => fetchJSON<ProcurementOpportunity[]>('/api/procurement/opportunities'),

  // Knowledge Graph
  getKnowledgeGraph: () => fetchJSON<{ nodes: any[]; edges: any[] }>('/api/knowledge-graph'),

  // Tamper-Evident Audit
  getAuditTrail: (limit: number = 100) => fetchJSON<AuditLog[]>(`/api/audit?limit=${limit}`),
  verifyAudit: () => fetchJSON<{
    is_valid: boolean;
    total_logs_checked: number;
    verified_at: string;
    first_hash?: string;
    latest_hash?: string;
    corrupted_entry_index?: number;
    message: string;
  }>('/api/audit/verify', { method: 'POST' }),
  simulateTamper: () => fetchJSON<{ tampered_sequence: number; status: string }>('/api/audit/simulate-tamper', { method: 'POST' }),
  restoreTamper: () => fetchJSON<{ restored_sequence: number; status: string }>('/api/audit/restore-tamper', { method: 'POST' }),

  // Demo management
  getDemoCases: () => fetchJSON<any>('/api/demo/cases'),
  resetDemoData: (confirmation: string) => {
    const formData = new FormData();
    formData.append('confirmation', confirmation);
    return fetch(`${API_BASE}/api/demo/reset`, {
      method: 'POST',
      body: formData
    }).then(r => r.json());
  },

  // Technical Conflict Review
  reviewConflict: (id: number, review_status: string, override_reason: string) =>
    fetchJSON<{ message: string; id: number; status: string }>(`/api/conflicts/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ review_status, override_reason })
    }),

  // CNMC Creation & Mappings
  createCommonMaterial: (data: any) =>
    fetchJSON<CommonMaterial>('/api/common-materials', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getMappings: () => fetchJSON<any[]>('/api/mappings'),

  // Standardization Center
  standardizeMaterial: (id: number, data: any) =>
    fetchJSON<{ message: string; id: number; version: number }>(`/api/materials/${id}/standardize`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Search
  searchMaterials: (q: string) =>
    fetchJSON<{ query: string; total: number; items: MaterialListItem[] }>(`/api/materials/search?q=${encodeURIComponent(q)}`),

  // Analytics
  getAnalytics: () => fetchJSON<any>('/api/analytics'),

  // Mock SAP / ERP Integration
  getSapStatus: () => fetchJSON<any>('/api/integrations/sap/status'),
  syncToSap: (target_system: string = 'SAP_S4HANA', cpse_code: string = 'CPCL') =>
    fetchJSON<{ status: string; transaction_id: string; message: string; materials_synced: number }>('/api/integrations/sap/sync', {
      method: 'POST',
      body: JSON.stringify({ target_system, cpse_code })
    }),
  inboundSapIdoc: (payload: any) =>
    fetchJSON<any>('/api/integrations/sap/inbound', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Global Search
  globalSearch: (q: string) => fetchJSON<{ query: string; total_found: number; results: any[] }>(`/api/search/global?q=${encodeURIComponent(q)}`),

  // Settings
  getSettings: () => fetchJSON<any>('/api/settings'),

  // Export URLs
  exportMaterialsUrl: `${API_BASE}/api/export/materials`,
  exportAuditUrl: `${API_BASE}/api/export/audit`,
  exportMatchesUrl: `${API_BASE}/api/export/matches`,
  exportCommonMaterialsUrl: `${API_BASE}/api/export/common-materials`
};
