import React, { useEffect, useState } from 'react';
import { Alert, AlertFilters, AlertUpdate, fetchAlerts, updateAlert } from '../api/alerts';

const statusColors: Record<string, string> = {
  open: '#ef4444',
  investigating: '#f59e0b',
  resolved: '#22c55e',
  false_positive: '#6b7280',
};

const severityColors: Record<string, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#ef4444',
  critical: '#b91c1c',
};

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export const AlertsTable: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AlertFilters>({});
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 50;
  const [editingAlert, setEditingAlert] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<AlertUpdate>({});

  const load = async (nextFilters: AlertFilters = filters, nextOffset = 0) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAlerts(nextFilters, nextOffset, limit);
      setAlerts(data.items);
      setTotal(data.total);
      setOffset(nextOffset);
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

  const handleFilterChange = (key: keyof AlertFilters, value: string) => {
    const next: AlertFilters = {
      ...filters,
      [key]: value || undefined,
    };
    setFilters(next);
    load(next, 0);
  };

  const handleUpdateAlert = async (alertId: number) => {
    try {
      await updateAlert(alertId, editForm);
      setEditingAlert(null);
      setEditForm({});
      load(filters, offset);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update alert');
    }
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
          <label style={{ fontSize: 12, color: '#9ca3af' }}>Status</label>
          <select
            value={filters.status ?? ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #374151',
              backgroundColor: '#020617',
              color: '#e5e7eb',
            }}
          >
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="false_positive">False Positive</option>
          </select>
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
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #1f2937' }}>Rule</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #1f2937' }}>Event</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #1f2937' }}>Severity</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #1f2937' }}>Status</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #1f2937' }}>Assigned</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #1f2937' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} style={{ padding: '12px', textAlign: 'center', color: '#9ca3af' }}>
                  Loading alerts...
                </td>
              </tr>
            )}
            {error && !loading && (
              <tr>
                <td colSpan={6} style={{ padding: '12px', textAlign: 'center', color: '#f97316' }}>
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && alerts.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '12px', textAlign: 'center', color: '#6b7280' }}>
                  No alerts found.
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              alerts.map((alert) => {
                const statusColor = statusColors[alert.status] ?? '#6b7280';
                const severityColor = severityColors[alert.event_severity.toLowerCase()] ?? '#6b7280';
                const isEditing = editingAlert === alert.id;

                return (
                  <tr key={alert.id} style={{ borderTop: '1px solid #111827' }}>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ fontWeight: 500 }}>{alert.rule_name}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Rule #{alert.rule_id}</div>
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>
                        {new Date(alert.event_timestamp).toLocaleString()}
                      </div>
                      <div style={{ fontSize: 13 }}>{alert.event_description}</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>
                        {alert.event_source} &middot; {alert.event_category}
                      </div>
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          backgroundColor: severityColor + '33',
                          color: severityColor,
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        {capitalize(alert.event_severity)}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      {isEditing ? (
                        <select
                          value={editForm.status ?? alert.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid #374151',
                            backgroundColor: '#020617',
                            color: '#e5e7eb',
                            fontSize: 12,
                          }}
                        >
                          <option value="open">Open</option>
                          <option value="investigating">Investigating</option>
                          <option value="resolved">Resolved</option>
                          <option value="false_positive">False Positive</option>
                        </select>
                      ) : (
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '999px',
                            backgroundColor: statusColor + '33',
                            color: statusColor,
                            fontSize: 12,
                            fontWeight: 500,
                          }}
                        >
                          {capitalize(alert.status)}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      {isEditing ? (
                        <input
                          type="text"
                          placeholder="username"
                          value={editForm.assigned_to ?? alert.assigned_to ?? ''}
                          onChange={(e) => setEditForm({ ...editForm, assigned_to: e.target.value || null })}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid #374151',
                            backgroundColor: '#020617',
                            color: '#e5e7eb',
                            fontSize: 12,
                            width: '100px',
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: 12, color: alert.assigned_to ? '#e5e7eb' : '#6b7280' }}>
                          {alert.assigned_to || 'Unassigned'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => handleUpdateAlert(alert.id)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: 'none',
                              backgroundColor: '#22c55e',
                              color: '#fff',
                              cursor: 'pointer',
                              fontSize: 11,
                            }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingAlert(null);
                              setEditForm({});
                            }}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: 'none',
                              backgroundColor: '#6b7280',
                              color: '#fff',
                              cursor: 'pointer',
                              fontSize: 11,
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingAlert(alert.id);
                            setEditForm({ status: alert.status, assigned_to: alert.assigned_to });
                          }}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: 'none',
                            backgroundColor: '#3b82f6',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: 11,
                          }}
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {total > limit && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>
            Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => load(filters, Math.max(0, offset - limit))}
              disabled={offset === 0}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #374151',
                backgroundColor: offset === 0 ? '#111827' : '#0f172a',
                color: '#e5e7eb',
                cursor: offset === 0 ? 'not-allowed' : 'pointer',
                fontSize: 12,
              }}
            >
              Previous
            </button>
            <button
              onClick={() => load(filters, offset + limit)}
              disabled={offset + limit >= total}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #374151',
                backgroundColor: offset + limit >= total ? '#111827' : '#0f172a',
                color: '#e5e7eb',
                cursor: offset + limit >= total ? 'not-allowed' : 'pointer',
                fontSize: 12,
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

