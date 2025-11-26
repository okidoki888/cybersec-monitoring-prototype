import React, { useEffect, useState } from 'react';
import { EventFilters, EventsSummary, fetchEventsSummary } from '../api/events';

type Props = {
  filters: EventFilters;
};

export const SummaryHeader: React.FC<Props> = ({ filters }) => {
  const [summary, setSummary] = useState<EventsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const data = await fetchEventsSummary(filters);
      setSummary(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load summary');
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  if (error) {
    return (
      <div style={{ fontSize: 12, color: '#f97316' }}>
        Failed to load summary: {error}
      </div>
    );
  }

  if (!summary) {
    return (
      <div style={{ fontSize: 12, color: '#9ca3af' }}>
        Loading summary...
      </div>
    );
  }

  const critical = summary.by_severity.critical ?? 0;
  const high = summary.by_severity.high ?? 0;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 12,
        marginBottom: 16,
      }}
    >
      <SummaryCard
        label="Total events"
        value={summary.total}
        accent="#38bdf8"
      />
      <SummaryCard
        label="High & Critical"
        value={high + critical}
        accent="#ef4444"
      />
      <SummaryCard
        label="Categories"
        value={Object.keys(summary.by_category).length}
        accent="#a855f7"
      />
      <SummaryCard
        label="Last event"
        value={
          summary.last_event_at
            ? new Date(summary.last_event_at).toLocaleString()
            : 'N/A'
        }
        accent="#22c55e"
      />
    </div>
  );
};

type CardProps = {
  label: string;
  value: number | string;
  accent: string;
};

const SummaryCard: React.FC<CardProps> = ({ label, value, accent }) => {
  return (
    <div
      style={{
        borderRadius: 10,
        padding: 10,
        border: '1px solid #1f2937',
        background:
          'radial-gradient(circle at top left, rgba(148,163,184,0.16), #020617)',
      }}
    >
      <div
        style={{
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 0.08,
          color: '#9ca3af',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: '#e5e7eb',
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: 6,
          height: 3,
          borderRadius: 999,
          backgroundColor: accent,
          opacity: 0.8,
        }}
      />
    </div>
  );
};



