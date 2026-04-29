'use client';

import { useState, useCallback } from 'react';

const MEMTABLE_LIMIT = 4;

interface Entry { key: string; value: string; }

export default function LSMTreePage() {
  const [memtable, setMemtable] = useState<Entry[]>([]);
  const [levels, setLevels] = useState<Entry[][]>([[], []]);
  const [inputKey, setInputKey] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [log, setLog] = useState<string[]>([]);

  const put = useCallback(() => {
    if (!inputKey.trim()) return;
    const entry = { key: inputKey.trim(), value: inputValue.trim() || `v${Date.now() % 10000}` };

    setMemtable(prev => {
      const updated = [...prev.filter(e => e.key !== entry.key), entry]
        .sort((a, b) => a.key.localeCompare(b.key));

      if (updated.length >= MEMTABLE_LIMIT) {
        // Flush to L0
        setLevels(prevLevels => {
          const merged = [...prevLevels[0], ...updated];
          const deduped = Object.values(
            Object.fromEntries(merged.map(e => [e.key, e]))
          ).sort((a, b) => a.key.localeCompare(b.key));
          return [deduped, prevLevels[1]];
        });
        setLog(prevLog => [
          ...prevLog.slice(-20),
          `FLUSH: memtable full (${MEMTABLE_LIMIT} entries) → flushed to L0`
        ]);
        return [];
      }

      setLog(prevLog => [...prevLog.slice(-20), `PUT "${entry.key}" = "${entry.value}" → memtable`]);
      return updated;
    });

    setInputKey('');
    setInputValue('');
  }, [inputKey, inputValue]);

  const compact = useCallback(() => {
    setLevels(prev => {
      if (prev[0].length === 0) {
        setLog(prevLog => [...prevLog.slice(-20), 'COMPACT: L0 is empty, nothing to do']);
        return prev;
      }
      const merged = [...prev[0], ...prev[1]];
      const deduped = Object.values(
        Object.fromEntries(merged.map(e => [e.key, e]))
      ).sort((a, b) => a.key.localeCompare(b.key));
      setLog(prevLog => [
        ...prevLog.slice(-20),
        `COMPACT: L0 (${prev[0].length}) merged into L1 → ${deduped.length} entries`
      ]);
      return [[], deduped];
    });
  }, []);

  const search = useCallback((key: string) => {
    if (!key) return;
    // Search order: memtable → L0 → L1 (newest first)
    const memHit = memtable.find(e => e.key === key);
    if (memHit) {
      setLog(prev => [...prev.slice(-20), `SEARCH "${key}" → memtable HIT: "${memHit.value}"`]);
      return;
    }
    for (let i = 0; i < levels.length; i++) {
      const hit = levels[i].find(e => e.key === key);
      if (hit) {
        setLog(prev => [...prev.slice(-20), `SEARCH "${key}" → L${i} HIT: "${hit.value}"`]);
        return;
      }
    }
    setLog(prev => [...prev.slice(-20), `SEARCH "${key}" → NOT FOUND (checked memtable + all levels)`]);
  }, [memtable, levels]);

  const totalEntries = memtable.length + levels[0].length + levels[1].length;

  return (
    <div className="animate-in">
      <div className="page-header">
        <span className="category-tag">storage</span>
        <h1>LSM Tree</h1>
        <p className="subtitle">
          Log-Structured Merge Tree: write to sorted memtable → flush to L0 when full → compact deeper.
        </p>
      </div>

      <div className="stats-row" style={{ marginBottom: 16 }}>
        <div className="stat">
          <span className="stat-label">memtable</span>
          <span className="stat-value">{memtable.length}/{MEMTABLE_LIMIT}</span>
        </div>
        <div className="stat">
          <span className="stat-label">L0</span>
          <span className="stat-value">{levels[0].length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">L1</span>
          <span className="stat-value">{levels[1].length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">total</span>
          <span className="stat-value">{totalEntries}</span>
        </div>
      </div>

      <div className="viz-controls" style={{ marginBottom: 16 }}>
        <input value={inputKey} onChange={e => setInputKey(e.target.value)} placeholder="key" className="sim-input" />
        <input value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="value" className="sim-input" onKeyDown={e => e.key === 'Enter' && put()} />
        <button onClick={put} className="btn btn-accent">PUT</button>
        <button onClick={() => search(inputKey.trim())} className="btn">SEARCH</button>
        <button onClick={compact} className="btn">Compact L0→L1</button>
      </div>

      <div className="viz-container" style={{ marginBottom: 16 }}>
        {/* Memtable */}
        <div style={{
          padding: 12,
          marginBottom: 8,
          background: 'var(--accent-glow)',
          border: '1px solid var(--accent)',
          borderRadius: 'var(--radius)'
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', marginBottom: 8 }}>
            🧠 Memtable (in-memory, sorted) — {memtable.length}/{MEMTABLE_LIMIT}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', minHeight: 24 }}>
            {memtable.length === 0 ? (
              <span style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic' }}>empty</span>
            ) : (
              memtable.map(e => (
                <span key={e.key} style={{
                  padding: '3px 8px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--accent)',
                  borderRadius: 4,
                  fontSize: 11,
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {e.key}:{e.value}
                </span>
              ))
            )}
          </div>
          {/* Fill indicator */}
          <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, marginTop: 8 }}>
            <div style={{
              height: '100%',
              width: `${(memtable.length / MEMTABLE_LIMIT) * 100}%`,
              background: memtable.length >= MEMTABLE_LIMIT - 1 ? 'var(--warning)' : 'var(--accent)',
              borderRadius: 2,
              transition: 'width 0.3s'
            }} />
          </div>
        </div>

        <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 11, marginBottom: 8 }}>
          ↓ flush when full ↓
        </div>

        {/* Levels */}
        {levels.map((level, i) => (
          <div key={i} style={{
            padding: 12,
            marginBottom: 8,
            background: 'var(--surface-2)',
            border: `1px solid ${level.length > 0 ? 'var(--border)' : 'var(--border)'}`,
            borderRadius: 'var(--radius)'
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-bright)', marginBottom: 8 }}>
              💾 Level {i} (on disk, sorted) — {level.length} entries
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', minHeight: 24 }}>
              {level.length === 0 ? (
                <span style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic' }}>empty</span>
              ) : (
                level.map(e => (
                  <span key={e.key} style={{
                    padding: '3px 8px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 4,
                    fontSize: 10,
                    color: 'var(--text-dim)',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {e.key}:{e.value}
                  </span>
                ))
              )}
            </div>
          </div>
        ))}
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
            <li>Writes go to in-memory sorted memtable (fast)</li>
            <li>When full, memtable flushed as sorted run to L0</li>
            <li>Background compaction merges levels (deduplicates)</li>
            <li>Reads check memtable → L0 → L1 (newest first)</li>
          </ul>
        </div>
        <div className="info-panel">
          <h3>Use Cases</h3>
          <ul style={{ fontSize: 12, lineHeight: 1.6 }}>
            <li>LevelDB, RocksDB, Cassandra</li>
            <li>Write-heavy workloads</li>
            <li>Time-series databases</li>
            <li>Key-value stores with high throughput</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
