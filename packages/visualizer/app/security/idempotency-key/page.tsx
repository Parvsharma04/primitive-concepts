'use client';

import { useState, useCallback, useRef } from 'react';

interface StoredRequest {
  key: string;
  response: string;
  createdAt: number;
}

export default function IdempotencyKeyPage() {
  const [store, setStore] = useState<Record<string, StoredRequest>>({});
  const [log, setLog] = useState<string[]>([]);
  const [inputKey, setInputKey] = useState('');
  const nextOp = useRef(0);

  const sendRequest = useCallback(() => {
    const key = inputKey.trim() || `idem-${Math.random().toString(36).slice(2, 8)}`;

    setStore(prev => {
      if (prev[key]) {
        // Duplicate - return cached response
        setLog(prevLog => [
          ...prevLog.slice(-20),
          `⚡ DUPLICATE key="${key}" → returning cached: "${prev[key].response}" (no side effects)`
        ]);
        setInputKey(key);
        return prev;
      }

      // New request - process and store
      nextOp.current++;
      const response = `result_${nextOp.current}`;
      const entry: StoredRequest = { key, response, createdAt: Date.now() };
      setLog(prevLog => [
        ...prevLog.slice(-20),
        `✓ NEW key="${key}" → processed → response: "${response}"`
      ]);
      setInputKey(key); // Keep same key to demo retries
      return { ...prev, [key]: entry };
    });
  }, [inputKey]);

  const newKey = useCallback(() => {
    setInputKey(`idem-${Math.random().toString(36).slice(2, 8)}`);
  }, []);

  const reset = useCallback(() => {
    setStore({});
    setLog([]);
    setInputKey('');
    nextOp.current = 0;
  }, []);

  const storeEntries = Object.values(store);
  const duplicateCount = log.filter(l => l.includes('DUPLICATE')).length;

  return (
    <div className="animate-in">
      <div className="page-header">
        <span className="category-tag">security</span>
        <h1>Idempotency Key</h1>
        <p className="subtitle">
          Same key = same result. Retry safely without duplicate side effects.
        </p>
      </div>

      <div className="stats-row" style={{ marginBottom: 16 }}>
        <div className="stat">
          <span className="stat-label">stored keys</span>
          <span className="stat-value">{storeEntries.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">duplicates blocked</span>
          <span className="stat-value" style={{ color: 'var(--warning)' }}>{duplicateCount}</span>
        </div>
        <div className="stat">
          <span className="stat-label">processed</span>
          <span className="stat-value" style={{ color: 'var(--accent)' }}>{nextOp.current}</span>
        </div>
      </div>

      <div className="viz-controls" style={{ marginBottom: 16 }}>
        <input
          value={inputKey}
          onChange={e => setInputKey(e.target.value)}
          placeholder="idempotency key (or auto-generate)"
          className="sim-input"
          style={{ width: 250 }}
          onKeyDown={e => e.key === 'Enter' && sendRequest()}
        />
        <button onClick={sendRequest} className="btn btn-accent">Send Request</button>
        <button onClick={newKey} className="btn">New Key</button>
        <button onClick={reset} className="btn">Reset</button>
      </div>

      <div style={{
        padding: 12,
        marginBottom: 16,
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        fontSize: 11,
        color: 'var(--text-dim)'
      }}>
        💡 Click &quot;Send Request&quot; multiple times with the same key — the operation executes only once.
      </div>

      <div className="viz-container" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-bright)', marginBottom: 12 }}>
          Idempotency Store ({storeEntries.length} keys)
        </div>
        {storeEntries.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-dim)', fontSize: 12, fontStyle: 'italic' }}>
            No requests processed yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {storeEntries.map(entry => (
              <div key={entry.key} style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 8,
                padding: '8px 12px',
                background: entry.key === inputKey ? 'var(--accent-glow)' : 'var(--surface)',
                border: `1px solid ${entry.key === inputKey ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)'
              }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                    {entry.key}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                    → {entry.response}
                  </div>
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-dim)', alignSelf: 'center' }}>
                  {Math.round((Date.now() - entry.createdAt) / 1000)}s ago
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="info-panel">
        <h3>// request log</h3>
        <div className="log-area">
          {log.length === 0 ? (
            <div style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic' }}>No requests yet</div>
          ) : (
            log.map((entry, i) => (
              <div key={i} className="log-entry" style={{
                color: entry.includes('DUPLICATE') ? 'var(--warning)' : 'var(--text-dim)'
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
            <li>Client generates unique key per operation</li>
            <li>Server checks: key seen before?</li>
            <li>If yes → return cached response (no re-execution)</li>
            <li>If no → execute, store result, return response</li>
          </ul>
        </div>
        <div className="info-panel">
          <h3>Use Cases</h3>
          <ul style={{ fontSize: 12, lineHeight: 1.6 }}>
            <li>Payment processing (Stripe Idempotency-Key)</li>
            <li>Order creation (prevent double-charge)</li>
            <li>Network retries in unreliable connections</li>
            <li>Any non-idempotent POST/PUT operation</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
