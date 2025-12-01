import React, { useEffect, useState } from 'react';
import { getMitreTactics, type MitreTactic } from '../api/mitre';

export const AttackMatrix: React.FC = () => {
  const [tactics, setTactics] = useState<MitreTactic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMitreData();
  }, []);

  const loadMitreData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMitreTactics();
      setTactics(data.tactics);
    } catch (err) {
      console.error('Failed to load MITRE data:', err);
      setError('Не удалось загрузить данные MITRE ATT&CK. Проверьте подключение к интернету.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          color: '#9ca3af'
        }}
      >
        <div>
          <div style={{ fontSize: 32, marginBottom: 16, textAlign: 'center' }}>⏳</div>
          <div>Загрузка данных MITRE ATT&CK...</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
            Получение актуальных данных из официального репозитория
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: '24px',
          borderRadius: '10px',
          border: '1px solid #991b1b',
          background: 'linear-gradient(145deg, #450a0a, #1a0000)',
          color: '#fca5a5'
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 16 }}>⚠️</div>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Ошибка загрузки</div>
        <div style={{ color: '#f87171' }}>{error}</div>
        <button
          onClick={loadMitreData}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid #991b1b',
            background: '#450a0a',
            color: '#fca5a5',
            cursor: 'pointer'
          }}
        >
          Повторить попытку
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          marginBottom: '16px',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid #1f2937',
          background: 'linear-gradient(145deg, #0f172a, #020617)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e5e7eb' }}>
            MITRE ATT&CK® Enterprise Matrix
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
            Актуальные данные из официального репозитория | {tactics.length} тактик | {' '}
            {tactics.reduce((sum, t) => sum + t.techniques.length, 0)} техник
          </div>
        </div>
        <button
          onClick={loadMitreData}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #1f2937',
            background: '#020617',
            color: '#9ca3af',
            cursor: 'pointer',
            fontSize: 12
          }}
          title="Обновить данные"
        >
          🔄 Обновить
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        {tactics.map((tactic) => (
          <div
            key={tactic.id}
            style={{
              borderRadius: '10px',
              border: '1px solid #1f2937',
              background: 'linear-gradient(145deg, #020617, #0b1120)',
              padding: '14px',
              minHeight: '200px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  color: '#6b7280',
                  marginBottom: 4
                }}
              >
                Tactic
              </div>
              <div style={{ fontWeight: 600, color: '#e5e7eb', fontSize: 15 }}>
                {tactic.name}
              </div>
              {tactic.description && (
                <div
                  style={{
                    fontSize: 11,
                    color: '#6b7280',
                    marginTop: 6,
                    lineHeight: 1.4
                  }}
                >
                  {tactic.description.substring(0, 100)}...
                </div>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  color: '#6b7280',
                  marginBottom: 8
                }}
              >
                Techniques ({tactic.techniques.length})
              </div>
              <div
                style={{
                  maxHeight: '300px',
                  overflowY: 'auto',
                  paddingRight: '8px'
                }}
              >
                <ul style={{ margin: 0, paddingLeft: '18px', color: '#9ca3af', fontSize: 12 }}>
                  {tactic.techniques.slice(0, 10).map((tech) => (
                    <li
                      key={tech.id}
                      style={{
                        marginBottom: 6,
                        lineHeight: 1.4
                      }}
                      title={tech.description}
                    >
                      <span style={{ color: '#6b7280', fontSize: 11 }}>
                        {tech.external_id}
                      </span>{' '}
                      <span style={{ color: '#e5e7eb' }}>{tech.name}</span>
                    </li>
                  ))}
                  {tactic.techniques.length > 10 && (
                    <li style={{ color: '#6b7280', fontStyle: 'italic' }}>
                      +{tactic.techniques.length - 10} больше техник...
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
