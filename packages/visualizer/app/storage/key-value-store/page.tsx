'use client';

import { useState, useCallback } from 'react';

export default function KeyValueStorePage() {
  const [store, setStore] = useState<Record<string, string>>({});
  const [inputKey, setInputKey] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [getResult, setGetResult] = useState<{ key: string; found: boolean; value?: string } | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [opCount, setOpCount] = useState(0);

  const put = useCallback(() => {
    if (!inputKey.trim()) return;
    const key = inputKey.trim();
    const value = inputValue.trim();
    setStore(prev => {
      const isUpdate = key in prev;
      setLog(prevLog => [
        ...prevLog.slice(-20),
        `PUT "${key}" = "${value}" ${isUpdate ? '(updated)' : '(new key)'}`
      ]);
      setOpCount(c => c + 1);
      return { ...prev, [key]: value };
    });
    setInputKey('');
    setInputValue('');
    setGetResult(null);
  }, [inputKey, inputValue]);

  const get = useCallback(() => {
    if (!inputKey.trim()) return;
    const key = inputKey.trim();
    setStore(prev => {
      const val = prev[key];
      if (val !== undefined) {
        setGetResult({ key, found: true, value: val });
        setLog(prevLog => [...prevLog.slice(-20), `GET "${key}" → "${val}" ✓`]);
      } else {
        setGetResult({ key, found: false });
        setLog(prevLog => [...prevLog.slice(-20), `GET "${key}" → NOT FOUND ✗`]);
      }
      setOpCount(c => c + 1);
      return prev;
    });
  }, [inputKey]);

  const del = useCallback(() => {
    if (!inputKey.trim()) return;
    const key = inputKey.trim();
    setStore(prev => {
      if (!(key in prev)) {
        setLog(prevLog => [...prevLog.slice(-20), `DEL "${key}" → key not found`]);
        return prev;
      }
      const next = { ...prev };
      delete next[key];
      setLog(prevLog => [...prevLog.slice(-20), `DEL "${key}" → removed ✓`]);
      setOpCount(c => c + 1);
      return next;
    });
    setInputKey('');
    setGetResult(null);
  }, [inputKey]);

  return (
    <div className="animate-in">
      <div className="page-header">
        <span className="category-tag">storage</span>
        <h1>Key-Value Store</h1>
        <p className="subtitle">
          O(1) get/put/delete backed by a hash map. The simplest storage abstraction.
        </p>
      </div>

      <div className="stats-row" style={{ marginBottom: 16 }}>
        <div className="stat">
          <span className="stat-label">entries</span>
          <span className="stat-value">{Object.keys(store).length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">operations</span>
          <span className="stat-value">{opCount}</span>
        </div>
      </div>

      <div className="viz-controls" style={{ marginBottom: 16 }}>
        <input value={inputKey} onChange={e => setInputKey(e.target.value)} placeholder="key" className="sim-input" />
        <input value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="value" className="sim-input" onKeyDown={e => e.key === 'Enter' && put()} />
        <button onClick={put} className="btn btn-accent">PUT</button>
        <button onClick={get} className="btn">GET</button>
        <button onClick={del} className="btn" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>DEL</button>
      </div>

      {getResult && (
        <div style={{
          padding: '8px 12px',
          marginBottom: 16,
          borderRadius: 'var(--radius)',
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
          background: getResult.found ? 'var(--accent-glow)' : 'var(--danger-glow)',
          border: `1px solid ${getResult.found ? 'var(--accent)' : 'var(--danger)'}`,
          color: getResult.found ? 'var(--accent)' : 'var(--danger)'
        }}>
          GET &quot;{getResult.key}&quot; → {getResult.found ? `"${getResult.value}"` : 'NOT FOUND'}
        </div>
      )}

      <div className="viz-container" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-bright)', marginBottom: 12 }}>
          Hash Map ({Object.keys(store).length} entries)
        </div>
        {Object.keys(store).length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-dim)', fontSize: 12, fontStyle: 'italic' }}>
            empty — use PUT to add entries
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
            {Object.entries(store).map(([k, v]) => (
              <div key={k} style={{
                padding: '8px 12px',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11
              }}>
                <div style={{ color: 'var(--accent)', marginBottom: 2 }}>{k}</div>
                <div style={{ color: 'var(--text-dim)' }}>&quot;{v}&quot;</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="info-panel">
        <h3>// operation log</h3>
        <div className="log-area">
          {log.length === 0 ? (
            <div style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic' }}>No operations yet</div>
          ) : (
            log.map((entry, i) => (
              <div key={i} className="log-entry">
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
            <li>Hash function maps keys → array indices</li>
            <li>GET/PUT/DEL all O(1) average case</li>
            <li>Collisions handled via chaining/open addressing</li>
            <li>Foundation of caches and in-memory DBs</li>
          </ul>
        </div>
        <div className="info-panel">
          <h3>Use Cases</h3>
          <ul style={{ fontSize: 12, lineHeight: 1.6 }}>
            <li>Redis, Memcached</li>
            <li>Session stores</li>
            <li>Configuration management</li>
            <li>DynamoDB (partition key lookup)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
