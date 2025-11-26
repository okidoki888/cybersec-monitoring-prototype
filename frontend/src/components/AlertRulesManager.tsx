import React, { useEffect, useState } from 'react';
import {
  AlertRule,
  AlertRuleCreate,
  createAlertRule,
  deleteAlertRule,
  fetchAlertRules,
  updateAlertRule,
} from '../api/alerts';

export const AlertRulesManager: React.FC = () => {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRule, setEditingRule] = useState<number | null>(null);
  const [formData, setFormData] = useState<AlertRuleCreate>({
    name: '',
    description: '',
    severity_filter: '',
    category_filter: '',
    source_filter: '',
    is_active: true,
  });

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAlertRules();
      setRules(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    try {
      await createAlertRule(formData);
      setShowCreateForm(false);
      setFormData({
        name: '',
        description: '',
        severity_filter: '',
        category_filter: '',
        source_filter: '',
        is_active: true,
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create rule');
    }
  };

  const handleUpdate = async (ruleId: number) => {
    try {
      await updateAlertRule(ruleId, formData);
      setEditingRule(null);
      setFormData({
        name: '',
        description: '',
        severity_filter: '',
        category_filter: '',
        source_filter: '',
        is_active: true,
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update rule');
    }
  };

  const handleDelete = async (ruleId: number) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    try {
      await deleteAlertRule(ruleId);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete rule');
    }
  };

  const startEdit = (rule: AlertRule) => {
    setEditingRule(rule.id);
    setFormData({
      name: rule.name,
      description: rule.description || '',
      severity_filter: rule.severity_filter || '',
      category_filter: rule.category_filter || '',
      source_filter: rule.source_filter || '',
      is_active: rule.is_active,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: 16, margin: 0 }}>Alert Rules</h3>
        <button
          onClick={() => setShowCreateForm(true)}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#22c55e',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          + New Rule
        </button>
      </div>

      {(showCreateForm || editingRule !== null) && (
        <div
          style={{
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: '#0f172a',
            border: '1px solid #1f2937',
          }}
        >
          <h4 style={{ fontSize: 14, marginBottom: '12px' }}>
            {editingRule ? 'Edit Rule' : 'Create New Rule'}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: 12, color: '#9ca3af', display: 'block', marginBottom: '4px' }}>
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #374151',
                  backgroundColor: '#020617',
                  color: '#e5e7eb',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#9ca3af', display: 'block', marginBottom: '4px' }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #374151',
                  backgroundColor: '#020617',
                  color: '#e5e7eb',
                  minHeight: '60px',
                }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: 12, color: '#9ca3af', display: 'block', marginBottom: '4px' }}>
                  Severity Filter
                </label>
                <select
                  value={formData.severity_filter}
                  onChange={(e) => setFormData({ ...formData, severity_filter: e.target.value || null })}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #374151',
                    backgroundColor: '#020617',
                    color: '#e5e7eb',
                  }}
                >
                  <option value="">Any</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#9ca3af', display: 'block', marginBottom: '4px' }}>
                  Category Filter
                </label>
                <input
                  type="text"
                  placeholder="e.g. network"
                  value={formData.category_filter}
                  onChange={(e) => setFormData({ ...formData, category_filter: e.target.value || null })}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #374151',
                    backgroundColor: '#020617',
                    color: '#e5e7eb',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#9ca3af', display: 'block', marginBottom: '4px' }}>
                  Source Filter
                </label>
                <input
                  type="text"
                  placeholder="e.g. Firewall"
                  value={formData.source_filter}
                  onChange={(e) => setFormData({ ...formData, source_filter: e.target.value || null })}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #374151',
                    backgroundColor: '#020617',
                    color: '#e5e7eb',
                  }}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  style={{ cursor: 'pointer' }}
                />
                Active
              </label>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => (editingRule ? handleUpdate(editingRule) : handleCreate())}
                disabled={!formData.name}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: formData.name ? '#22c55e' : '#374151',
                  color: '#fff',
                  cursor: formData.name ? 'pointer' : 'not-allowed',
                  fontSize: 13,
                }}
              >
                {editingRule ? 'Update' : 'Create'}
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingRule(null);
                  setFormData({
                    name: '',
                    description: '',
                    severity_filter: '',
                    category_filter: '',
                    source_filter: '',
                    is_active: true,
                  });
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #374151',
                  backgroundColor: 'transparent',
                  color: '#e5e7eb',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '12px',
            borderRadius: '6px',
            backgroundColor: '#7f1d1d',
            border: '1px solid #991b1b',
            color: '#fca5a5',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {loading && <div style={{ color: '#9ca3af', fontSize: 13 }}>Loading rules...</div>}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {rules.map((rule) => (
          <div
            key={rule.id}
            style={{
              padding: '12px',
              borderRadius: '6px',
              backgroundColor: '#0f172a',
              border: '1px solid #1f2937',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 500, fontSize: 14 }}>{rule.name}</span>
                <span
                  style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: rule.is_active ? '#22c55e33' : '#6b728033',
                    color: rule.is_active ? '#22c55e' : '#6b7280',
                    fontSize: 11,
                  }}
                >
                  {rule.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {rule.description && (
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: '4px' }}>{rule.description}</div>
              )}
              <div style={{ fontSize: 11, color: '#6b7280' }}>
                Filters:{' '}
                {[
                  rule.severity_filter && `Severity=${rule.severity_filter}`,
                  rule.category_filter && `Category=${rule.category_filter}`,
                  rule.source_filter && `Source=${rule.source_filter}`,
                ]
                  .filter(Boolean)
                  .join(', ') || 'None'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => startEdit(rule)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid #374151',
                  backgroundColor: 'transparent',
                  color: '#e5e7eb',
                  cursor: 'pointer',
                  fontSize: 11,
                }}
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(rule.id)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 11,
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

