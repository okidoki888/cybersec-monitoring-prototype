export type Alert = {
  id: number;
  rule_id: number;
  rule_name: string;
  event_id: string;
  event_timestamp: string;
  event_source: string;
  event_category: string;
  event_severity: string;
  event_description: string;
  status: string;
  assigned_to: string | null;
  notes: string | null;
  created_at: string;
  resolved_at: string | null;
};

export type AlertRule = {
  id: number;
  name: string;
  description: string | null;
  severity_filter: string | null;
  category_filter: string | null;
  source_filter: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
};

export type AlertRuleCreate = {
  name: string;
  description?: string | null;
  severity_filter?: string | null;
  category_filter?: string | null;
  source_filter?: string | null;
  is_active?: boolean;
};

export type AlertUpdate = {
  status?: string;
  assigned_to?: string | null;
  notes?: string | null;
};

export type PagedAlerts = {
  items: Alert[];
  total: number;
  offset: number;
  limit: number;
};

export type AlertFilters = {
  status?: string;
  rule_id?: number;
  assigned_to?: string;
};

async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Try to get JWT token from localStorage (if user logged in)
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Try to get API key from window (for machine-to-machine)
  const apiKey = (window as any).__API_KEY__;
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }

  return headers;
}

export async function fetchAlerts(
  filters: AlertFilters = {},
  offset = 0,
  limit = 50
): Promise<PagedAlerts> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.rule_id) params.set('rule_id', String(filters.rule_id));
  if (filters.assigned_to) params.set('assigned_to', filters.assigned_to);
  params.set('offset', String(offset));
  params.set('limit', String(limit));

  const res = await fetch(`/api/alerts/?${params.toString()}`, {
    headers: await getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Failed to load alerts: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function fetchAlertRules(is_active?: boolean): Promise<AlertRule[]> {
  const params = new URLSearchParams();
  if (is_active !== undefined) params.set('is_active', String(is_active));

  const res = await fetch(`/api/alerts/rules/?${params.toString()}`, {
    headers: await getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Failed to load alert rules: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function createAlertRule(rule: AlertRuleCreate): Promise<AlertRule> {
  const res = await fetch('/api/alerts/rules/', {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(rule),
  });

  if (!res.ok) {
    throw new Error(`Failed to create alert rule: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function updateAlertRule(ruleId: number, rule: AlertRuleCreate): Promise<AlertRule> {
  const res = await fetch(`/api/alerts/rules/${ruleId}`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: JSON.stringify(rule),
  });

  if (!res.ok) {
    throw new Error(`Failed to update alert rule: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function deleteAlertRule(ruleId: number): Promise<void> {
  const res = await fetch(`/api/alerts/rules/${ruleId}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Failed to delete alert rule: ${res.status} ${res.statusText}`);
  }
}

export async function updateAlert(alertId: number, update: AlertUpdate): Promise<Alert> {
  const res = await fetch(`/api/alerts/${alertId}`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: JSON.stringify(update),
  });

  if (!res.ok) {
    throw new Error(`Failed to update alert: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

