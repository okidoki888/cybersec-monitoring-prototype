import React, { useEffect, useState } from 'react';
import { EventFilters, fetchEventsPaged, PagedEvents, SecurityEvent } from '../api/events';

const severityColors: Record<string, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#ef4444',
  critical: '#b91c1c',
};

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export const EventsTable: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<EventFilters>({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const pageSize = 25;

  const load = async (nextFilters: EventFilters = filters, nextPage = page) => {
    try {
      setLoading(true);
      setError(null);
      const offset = nextPage * pageSize;
      const paged: PagedEvents = await fetchEventsPaged(nextFilters, offset, pageSize);
      setEvents(paged.items);
      setTotal(paged.total);
      setPage(nextPage);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (key: keyof EventFilters, value: string) => {
    const next: EventFilters = {
      ...filters,
      [key]: value || undefined,
    };
    setFilters(next);
    load(next, 0);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const changePage = (nextPage: number) => {
    const clamped = Math.min(Math.max(nextPage, 0), totalPages - 1);
    if (clamped === page) return;
    load(filters, clamped);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px',
          borderRadius: '8px',
          backgroundColor: '#0f172a',
          border: '1px solid #1f2937',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: 12, color: '#9ca3af' }}>Severity</label>
          <select
            value={filters.severity ?? ''}
            onChange={(e) => handleFilterChange('severity', e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #374151',
              backgroundColor: '#020617',
              color: '#e5e7eb',
            }}
          >
            <option value="">All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: 12, color: '#9ca3af' }}>Category</label>
          <input
            type="text"
            placeholder="e.g. network"
            value={filters.category ?? ''}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #374151',
              backgroundColor: '#020617',
              color: '#e5e7eb',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: 12, color: '#9ca3af' }}>Source</label>
          <input
            type="text"
            placeholder="Firewall, EDR..."
            value={filters.source ?? ''}
            onChange={(e) => handleFilterChange('source', e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #374151',
              backgroundColor: '#020617',
              color: '#e5e7eb',
            }}
          />
        </div>
      </div>

      <div
        style={{
          borderRadius: '8px',
          border: '1px solid #1f2937',
          overflow: 'hidden',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: '#020617',
            color: '#e5e7eb',
            fontSize: 14,
          }}
        >
          <thead style={{ backgroundColor: '#0f172a' }}>
            <tr>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #1f2937' }}>Time</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #1f2937' }}>Source</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #1f2937' }}>Category</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #1f2937' }}>Severity</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #1f2937' }}>Description</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} style={{ padding: '12px', textAlign: 'center', color: '#9ca3af' }}>
                  Loading events...
                </td>
              </tr>
            )}
            {error && !loading && (
              <tr>
                <td colSpan={5} style={{ padding: '12px', textAlign: 'center', color: '#f97316' }}>
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && events.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '12px', textAlign: 'center', color: '#6b7280' }}>
                  No events found for selected filters.
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              events.map((ev) => {
                const color = severityColors[ev.severity.toLowerCase()] ?? '#6b7280';
                return (
                  <tr key={ev.id} style={{ borderTop: '1px solid #111827' }}>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                      {new Date(ev.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: '8px 10px' }}>{ev.source}</td>
                    <td style={{ padding: '8px 10px' }}>{ev.category}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          backgroundColor: color + '33',
                          color,
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        {capitalize(ev.severity)}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px' }}>{ev.description}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 4,
          fontSize: 12,
          color: '#9ca3af',
        }}
      >
        <span>
          Showing{' '}
          {total === 0
            ? 0
            : `${page * pageSize + 1}-${Math.min((page + 1) * pageSize, total)}`}{' '}
          of {total} events
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={() => changePage(page - 1)}
            disabled={page === 0}
            style={{
              padding: '4px 8px',
              borderRadius: '999px',
              border: '1px solid #374151',
              backgroundColor: page === 0 ? '#020617' : '#0b1120',
              color: '#e5e7eb',
              cursor: page === 0 ? 'default' : 'pointer',
              fontSize: 11,
            }}
          >
            Prev
          </button>
          <span>
            Page {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => changePage(page + 1)}
            disabled={page + 1 >= totalPages}
            style={{
              padding: '4px 8px',
              borderRadius: '999px',
              border: '1px solid #374151',
              backgroundColor: page + 1 >= totalPages ? '#020617' : '#0b1120',
              color: '#e5e7eb',
              cursor: page + 1 >= totalPages ? 'default' : 'pointer',
              fontSize: 11,
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};


