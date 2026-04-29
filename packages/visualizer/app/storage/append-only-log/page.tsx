'use client';

import { useState, useCallback } from 'react';

interface LogEntry {
  offset: number;
  timestamp: number;
  data: string;
}

export default function AppendOnlyLogPage() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [inputData, setInputData] = useState('');

  const append = useCallback(() => {
    const data = inputData.trim() || `event_${Date.now() % 10000}`;
    setEntries(prev => [...prev, {
      offset: prev.length,
      timestamp: Date.now(),
      data
    }]);
    setInputData('');
  }, [inputData]);

  const appendBurst = useCallback(() => {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        setEntries(prev => [...prev, {
          offset: prev.length,
          timestamp: Date.now(),
          data: `batch_${prev.length}`
        }]);
      }, i * 100);
    }
  }, []);

  const totalSize = entries.reduce((s, e) => s + e.data.length, 0);

  return (
    <div className="animate-in">
      <div className="page-header">
        <span className="category-tag">storage</span>
        <h1>Append-Only Log</h1>
        <p className="subtitle">
          Immutable sequential writes — data is only ever appended, never modified or deleted.
        </p>
      </div>

      <div className="stats-row" style={{ marginBottom: 16 }}>
        <div className="stat">
          <span className="stat-label">entries</span>
          <span className="stat-value">{entries.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">head offset</span>
          <span className="stat-value">{entries.length > 0 ? entries.length - 1 : '-'}</span>
        </div>
        <div className="stat">
          <span className="stat-label">total bytes</span>
          <span className="stat-value">{totalSize}B</span>
        </div>
      </div>

      <div className="viz-controls" style={{ marginBottom: 16 }}>
        <input
          value={inputData}
          onChange={e => setInputData(e.target.value)}
          placeholder="data to append"
          className="sim-input"
          onKeyDown={e => e.key === 'Enter' && append()}
        />
        <button onClick={append} className="btn btn-accent">Append</button>
        <button onClick={appendBurst} className="btn">Burst ×5</button>
      </div>

      <div className="viz-container" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-bright)', marginBottom: 12 }}>
          📜 Log (append-only, immutable entries)
        </div>
        {entries.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-dim)', fontSize: 12, fontStyle: 'italic' }}>
            empty — append entries above
          </div>
        ) : (
          <div style={{ maxHeight: 300, overflow: 'auto' }}>
            {entries.map(e => (
              <div key={e.offset} style={{
                display: 'grid',
                gridTemplateColumns: '50px 90px 1fr',
                gap: 12,
                padding: '6px 8px',
                borderBottom: '1px solid var(--border)',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                alignItems: 'center'
              }}>
                <span style={{ color: 'var(--text-dim)' }}>[{e.offset}]</span>
                <span style={{ color: 'var(--text-dim)' }}>
                  {new Date(e.timestamp).toLocaleTimeString()}
                </span>
                <span style={{ color: 'var(--accent)' }}>{e.data}</span>
              </div>
            ))}
          </div>
        )}

        {entries.length > 0 && (
          <div style={{
            marginTop: 8,
            padding: 8,
            background: 'var(--surface-2)',
            borderRadius: 4,
            fontSize: 10,
            color: 'var(--text-dim)',
            textAlign: 'center'
          }}>
            ↑ newest (offset {entries.length - 1}) — oldest (offset 0) ↓
          </div>
        )}
      </div>

      <div className="info-columns" style={{ marginTop: 16 }}>
        <div className="info-panel">
          <h3>How It Works</h3>
          <ul style={{ fontSize: 12, lineHeight: 1.6 }}>
            <li>New entries always written at the end</li>
            <li>Existing entries never modified</li>
            <li>Sequential writes → optimal disk I/O</li>
            <li>Each entry has a unique monotonic offset</li>
          </ul>
        </div>
        <div className="info-panel">
          <h3>Use Cases</h3>
          <ul style={{ fontSize: 12, lineHeight: 1.6 }}>
            <li>Kafka commit log</li>
            <li>Event sourcing</li>
            <li>Write-ahead logs (WAL)</li>
            <li>Blockchain (immutable ledger)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
