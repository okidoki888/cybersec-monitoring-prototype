import React from 'react';

type Tactic = {
  id: string;
  name: string;
  techniques: string[];
};

const tactics: Tactic[] = [
  {
    id: 'recon',
    name: 'Reconnaissance',
    techniques: ['Scan network', 'Gather credentials', 'Enumerate services'],
  },
  {
    id: 'initial-access',
    name: 'Initial Access',
    techniques: ['Phishing', 'Exploit public-facing app', 'Valid accounts'],
  },
  {
    id: 'execution',
    name: 'Execution',
    techniques: ['Command execution', 'PowerShell', 'Scripting'],
  },
  {
    id: 'lateral-movement',
    name: 'Lateral Movement',
    techniques: ['RDP', 'PsExec', 'Pass-the-Hash'],
  },
];

export const AttackMatrix: React.FC = () => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
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
            padding: '12px',
          }}
        >
          <div style={{ marginBottom: '8px' }}>
            <div
              style={{
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: 0.08,
                color: '#6b7280',
              }}
            >
              Tactic
            </div>
            <div style={{ fontWeight: 600, color: '#e5e7eb' }}>{tactic.name}</div>
          </div>
          <ul style={{ margin: 0, paddingLeft: '18px', color: '#9ca3af', fontSize: 13 }}>
            {tactic.techniques.map((tech) => (
              <li key={tech} style={{ marginBottom: 4 }}>
                {tech}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

