export type SecurityEvent = {
  id: string;
  timestamp: string;
  source: string;
  category: string;
  severity: string;
  description: string;
};

export type EventFilters = {
  severity?: string;
  category?: string;
  source?: string;
};

export type PagedEvents = {
  items: SecurityEvent[];
  total: number;
  offset: number;
  limit: number;
};

export type EventsSummary = {
  total: number;
  by_severity: Record<string, number>;
  by_category: Record<string, number>;
  last_event_at: string | null;
};

const API_KEY_HEADER = 'X-API-Key';

function buildQuery(filters: EventFilters, offset?: number, limit?: number): string {
  const params = new URLSearchParams();

  if (filters.severity) params.set("severity", filters.severity);
  if (filters.category) params.set("category", filters.category);
  if (filters.source) params.set("source", filters.source);

  if (typeof offset === "number") params.set("offset", String(offset));
  if (typeof limit === "number") params.set("limit", String(limit));

  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function fetchEvents(filters: EventFilters = {}): Promise<SecurityEvent[]> {
  const query = buildQuery(filters);
  const url = `/api/events/${query}`;

  const res = await fetch(url, {
    headers: buildAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Failed to load events: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function fetchEventsPaged(
  filters: EventFilters = {},
  offset = 0,
  limit = 25,
): Promise<PagedEvents> {
  const query = buildQuery(filters, offset, limit);
  const url = `/api/events/paged${query}`;

  const res = await fetch(url, {
    headers: buildAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Failed to load paged events: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function fetchEventsSummary(filters: EventFilters = {}): Promise<EventsSummary> {
  const query = buildQuery(filters);
  const url = `/api/events/summary${query}`;

  const res = await fetch(url, {
    headers: buildAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Failed to load events summary: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Для прототипа ключ читаем из глобального window.__API_KEY__ если он определён.
 * Если ключа нет, заголовок не отправляем (поддержка режима без API_KEY на бэке).
 */
function buildAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const maybeKey = (window as any).__API_KEY__ as string | undefined;
  if (maybeKey) {
    headers[API_KEY_HEADER] = maybeKey;
  }
  return headers;
}


