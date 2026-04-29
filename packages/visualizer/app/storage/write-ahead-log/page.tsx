'use client';

import { useState, useCallback } from 'react';

interface WALEntry {
  lsn: number;
  op: string;
  applied: boolean;
}

export default function WriteAheadLogPage() {
  const [wal, setWal] = useState<WALEntry[]>([]);
  const [store, setStore] = useState<Record<string, string>>({});
  const [inputKey, setInputKey] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [crashed, setCrashed] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const write = useCallback(() => {
    if (!inputKey.trim() || crashed) return;
    const key = inputKey.trim();
    const value = inputValue.trim();
    const op = `SET ${key} = "${value}"`;

    // 1. Write to WAL first
    setWal(prev => {
      const entry: WALEntry = { lsn: prev.length, op, applied: false };
      setLog(prevLog => [...prevLog.slice(-20), `WAL: logged "${op}" (LSN ${entry.lsn})`]);

      // 2. Then apply to store (async)
      setTimeout(() => {
        setStore(prevStore => ({ ...prevStore, [key]: value }));
        setWal(prevWal => prevWal.map((e, i) =>
          i === prev.length ? { ...e, applied: true } : e
        ));
        setLog(prevLog => [...prevLog.slice(-20), `APPLY: "${op}" → store updated ✓`]);
      }, 300);

      return [...prev, entry];
    });

    setInputKey('');
    setInputValue('');
  }, [inputKey, inputValue, crashed]);

  const simulateCrash = useCallback(() => {
    setCrashed(true);
    setStore({});
    setWal(prev => prev.map(e => ({ ...e, applied: false })));
    setLog(prev => [...prev.slice(-20), '💥 CRASH — in-memory store LOST, WAL on disk preserved']);
  }, []);

  const recover = useCallback(() => {
    // Replay all WAL entries to reconstruct store
    setWal(prev => {
      const recovered: Record<string, string> = {};
      prev.forEach(e => {
        const match = e.op.match(/SET (\S+) = "(.*)"/);
        if (match) recovered[match[1]] = match[2];
      });
      setStore(recovered);
      setCrashed(false);
      setLog(prevLog => [
        ...prevLog.slice(-20),
        `RECOVER: replayed ${prev.length} WAL entries → store restored ✓`
      ]);
      return prev.map(e => ({ ...e, applied: true }));
    });
  }, []);

  const reset = useCallback(() => {
    setWal([]);
    setStore({});
    setCrashed(false);
    setLog([]);
  }, []);

  return (
    <div className="animate-in">
      <div className="page-header">
        <span className="category-tag">storage</span>
        <h1>Write-Ahead Log (WAL)</h1>
        <p className="subtitle">
          Log operations before applying — enables crash recovery by replaying the WAL from disk.
        </p>
      </div>

      <div className="stats-row" style={{ marginBottom: 16 }}>
        <div className="stat">
          <span className="stat-label">WAL entries</span>
          <span className="stat-value">{wal.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">store entries</span>
          <span className="stat-value">{Object.keys(store).length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">status</span>
          <span className="stat-value" style={{ color: crashed ? 'var(--danger)' : 'var(--accent)' }}>
            {crashed ? '💥 CRASHED' : '✓ RUNNING'}
          </span>
        </div>
      </div>

      <div className="viz-controls" style={{ marginBottom: 16 }}>
        <input value={inputKey} onChange={e => setInputKey(e.target.value)} placeholder="key" className="sim-input" />
        <input value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="value" className="sim-input" onKeyDown={e => e.key === 'Enter' && write()} />
        <button onClick={write} className="btn btn-accent" disabled={crashed}>Write</button>
        <button onClick={simulateCrash} className="btn" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
          Crash 💥
        </button>
        <button onClick={recover} className="btn" disabled={!crashed}>
          Recover
        </button>
        <button onClick={reset} className="btn">Reset</button>
      </div>

      <div className="viz-container" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* WAL (on disk) */}
          <div style={{
            padding: 12,
            background: 'var(--surface-2)',
            border: '1px solid var(--accent)',
            borderRadius: 'var(--radius)'
          }}>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--accent)',
              marginBottom: 8,
              paddingBottom: 6,
              borderBottom: '1px solid var(--border)'
            }}>
              💾 WAL (on disk — survives crash)
            </div>
            {wal.length === 0 ? (
              <div style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic' }}>empty</div>
            ) : (
              <div style={{ maxHeight: 200, overflow: 'auto' }}>
                {wal.map(e => (
                  <div key={e.lsn} style={{
                    fontSize: 11,
                    padding: '3px 0',
                    color: e.applied ? 'var(--accent)' : 'var(--warning)',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    [{e.lsn}] {e.op} {e.applied ? '✓' : '○'}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Store (in memory) */}
          <div style={{
            padding: 12,
            background: crashed ? 'var(--danger-glow)' : 'var(--surface-2)',
            border: `1px solid ${crashed ? 'var(--danger)' : 'var(--border)'}`,
            borderRadius: 'var(--radius)'
          }}>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              color: crashed ? 'var(--danger)' : 'var(--text-bright)',
              marginBottom: 8,
              paddingBottom: 6,
              borderBottom: '1px solid var(--border)'
            }}>
              🧠 Store (in memory) {crashed && '— LOST'}
            </div>
            {Object.keys(store).length === 0 ? (
              <div style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic' }}>
                {crashed ? '💥 data lost on crash' : 'empty'}
              </div>
            ) : (
              Object.entries(store).map(([k, v]) => (
                <div key={k} style={{ fontSize: 11, color: 'var(--text-dim)', padding: '2px 0', fontFamily: 'var(--font-mono)' }}>
                  {k}: &quot;{v}&quot;
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="info-panel">
        <h3>// event log</h3>
        <div className="log-area">
          {log.length === 0 ? (
            <div style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic' }}>No events yet</div>
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
            <li>All writes logged to WAL first (durable)</li>
            <li>Then applied to in-memory store</li>
            <li>On crash: replay WAL to restore state</li>
            <li>WAL is append-only → sequential I/O (fast)</li>
          </ul>
        </div>
        <div className="info-panel">
          <h3>Use Cases</h3>
          <ul style={{ fontSize: 12, lineHeight: 1.6 }}>
            <li>PostgreSQL, SQLite, MySQL InnoDB</li>
            <li>Raft/Paxos log replication</li>
            <li>Kafka commit log</li>
            <li>Any durable state machine</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
