'use client';

import { useState, useCallback } from 'react';

const VALID_KEYS: Record<string, { name: string; permissions: string[]; rateLimit: number }> = {
  'sk_live_abc123': { name: 'Frontend App', permissions: ['read'], rateLimit: 100 },
  'sk_live_xyz789': { name: 'Admin Service', permissions: ['read', 'write', 'delete'], rateLimit: 1000 },
  'sk_live_def456': { name: 'Analytics Worker', permissions: ['read', 'write'], rateLimit: 500 },
};

export default function APIKeyValidationPage() {
  const [inputKey, setInputKey] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [lastResult, setLastResult] = useState<{ valid: boolean; details?: typeof VALID_KEYS[string] } | null>(null);

  const validate = useCallback(() => {
    const key = inputKey.trim();
    if (!key) return;

    const entry = VALID_KEYS[key];
    if (entry) {
      setLastResult({ valid: true, details: entry });
      setLog(prev => [
        ...prev.slice(-20),
        `✓ VALID: "${entry.name}" — permissions: [${entry.permissions.join(', ')}] — rate limit: ${entry.rateLimit}/min`
      ]);
    } else {
      setLastResult({ valid: false });
      setLog(prev => [
        ...prev.slice(-20),
        `✗ INVALID: key "${key.slice(0, 10)}..." not recognized → 401 Unauthorized`
      ]);
    }
    setInputKey('');
  }, [inputKey]);

  const tryKey = useCallback((key: string) => {
    setInputKey(key);
  }, []);

  return (
    <div className="animate-in">
      <div className="page-header">
        <span className="category-tag">security</span>
        <h1>API Key Validation</h1>
        <p className="subtitle">
          Authenticate requests by matching the provided key against a registry. Simple but effective.
        </p>
      </div>

      <div className="stats-row" style={{ marginBottom: 16 }}>
        <div className="stat">
          <span className="stat-label">registered keys</span>
          <span className="stat-value">{Object.keys(VALID_KEYS).length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">last result</span>
          <span className="stat-value" style={{
            color: lastResult === null ? 'var(--text-dim)' : lastResult.valid ? 'var(--accent)' : 'var(--danger)'
          }}>
            {lastResult === null ? '-' : lastResult.valid ? '✓ VALID' : '✗ REJECTED'}
          </span>
        </div>
      </div>

      <div className="viz-controls" style={{ marginBottom: 16 }}>
        <input
          value={inputKey}
          onChange={e => setInputKey(e.target.value)}
          placeholder="Enter API key..."
          className="sim-input"
          style={{ width: 250 }}
          onKeyDown={e => e.key === 'Enter' && validate()}
        />
        <button onClick={validate} className="btn btn-accent">Validate</button>
      </div>

      {lastResult && (
        <div style={{
          padding: 12,
          marginBottom: 16,
          borderRadius: 'var(--radius)',
          background: lastResult.valid ? 'var(--accent-glow)' : 'var(--danger-glow)',
          border: `1px solid ${lastResult.valid ? 'var(--accent)' : 'var(--danger)'}`,
          color: lastResult.valid ? 'var(--accent)' : 'var(--danger)',
          fontSize: 12
        }}>
          {lastResult.valid ? (
            <>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>✓ Authenticated: {lastResult.details!.name}</div>
              <div style={{ fontSize: 11 }}>
                Permissions: [{lastResult.details!.permissions.join(', ')}] • Rate limit: {lastResult.details!.rateLimit}/min
              </div>
            </>
          ) : (
            <div style={{ fontWeight: 600 }}>✗ 401 Unauthorized — invalid API key</div>
          )}
        </div>
      )}

      <div className="viz-container" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-bright)', marginBottom: 12 }}>
          Key Registry (click to try)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Object.entries(VALID_KEYS).map(([key, val]) => (
            <div
              key={key}
              onClick={() => tryKey(key)}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto',
                gap: 12,
                alignItems: 'center',
                padding: '8px 12px',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                cursor: 'pointer'
              }}
            >
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-bright)', fontWeight: 600 }}>{val.name}</div>
                <div style={{ fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{key}</div>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                [{val.permissions.join(', ')}]
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                {val.rateLimit}/min
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="info-panel">
        <h3>// validation log</h3>
        <div className="log-area">
          {log.length === 0 ? (
            <div style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic' }}>No validations yet</div>
          ) : (
            log.map((entry, i) => (
              <div key={i} className="log-entry" style={{
                color: entry.includes('✗') ? 'var(--danger)' : 'var(--accent)'
              }}>
                <span style={{ color: 'var(--text-dim)', marginRight: 8 }}>[{String(i + 1).padStart(2, '0')}]</span>
                {entry}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="info-columns" style={{ marginTop: 16 }}>
        <div className="info-panel">
          <h3>How It Works</h3>
          <ul style={{ fontSize: 12, lineHeight: 1.6 }}>
            <li>Client sends key in Authorization header</li>
            <li>Server looks up key in registry/database</li>
            <li>If found → attach permissions, allow request</li>
            <li>If not found → 401 Unauthorized</li>
          </ul>
        </div>
        <div className="info-panel">
          <h3>Best Practices</h3>
          <ul style={{ fontSize: 12, lineHeight: 1.6 }}>
            <li>Prefix keys for identification (sk_live_...)</li>
            <li>Hash keys at rest (don't store plaintext)</li>
            <li>Rotate keys periodically</li>
            <li>Apply rate limits per key</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
