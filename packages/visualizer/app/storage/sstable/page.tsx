'use client';

import { useState, useCallback } from 'react';

interface SSTableFile {
  id: number;
  entries: { key: string; value: string }[];
}

export default function SSTablePage() {
  const [memtable, setMemtable] = useState<{ key: string; value: string }[]>([]);
  const [sstables, setSstables] = useState<SSTableFile[]>([]);
  const [inputKey, setInputKey] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [searchResult, setSearchResult] = useState<{ found: boolean; location: string; value?: string } | null>(null);

  const put = useCallback(() => {
    if (!inputKey.trim()) return;
    const entry = { key: inputKey.trim(), value: inputValue.trim() || `val_${inputKey.trim()}` };
    setMemtable(prev => {
      const updated = [...prev.filter(e => e.key !== entry.key), entry]
        .sort((a, b) => a.key.localeCompare(b.key));
      setLog(prevLog => [...prevLog.slice(-20), `PUT "${entry.key}" = "${entry.value}" → memtable`]);
      return updated;
    });
    setInputKey('');
    setInputValue('');
    setSearchResult(null);
  }, [inputKey, inputValue]);

  const flush = useCallback(() => {
    setMemtable(prev => {
      if (prev.length === 0) {
        setLog(prevLog => [...prevLog.slice(-20), 'FLUSH: memtable empty, nothing to flush']);
        return prev;
      }
      setSstables(prevSST => {
        const newFile: SSTableFile = { id: prevSST.length, entries: [...prev] };
        setLog(prevLog => [
          ...prevLog.slice(-20),
          `FLUSH: memtable → SSTable #${newFile.id} (${newFile.entries.length} sorted entries, immutable)`
        ]);
        return [...prevSST, newFile];
      });
      return [];
    });
  }, []);

  const search = useCallback(() => {
    if (!inputKey.trim()) return;
    const key = inputKey.trim();

    // Check memtable first
    const memHit = memtable.find(e => e.key === key);
    if (memHit) {
      setSearchResult({ found: true, location: 'memtable', value: memHit.value });
      setLog(prev => [...prev.slice(-20), `SEARCH "${key}" → memtable HIT: "${memHit.value}"`]);
      return;
    }

    // Check SSTables newest first (higher ID = newer)
    for (let i = sstables.length - 1; i >= 0; i--) {
      // Binary search (entries are sorted)
      const entries = sstables[i].entries;
      let lo = 0, hi = entries.length - 1;
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        const cmp = entries[mid].key.localeCompare(key);
        if (cmp === 0) {
          setSearchResult({ found: true, location: `SSTable #${i}`, value: entries[mid].value });
          setLog(prev => [...prev.slice(-20), `SEARCH "${key}" → SSTable #${i} HIT (binary search): "${entries[mid].value}"`]);
          return;
        }
        if (cmp < 0) lo = mid + 1;
        else hi = mid - 1;
      }
    }

    setSearchResult({ found: false, location: 'all' });
    setLog(prev => [...prev.slice(-20), `SEARCH "${key}" → NOT FOUND (checked memtable + ${sstables.length} SSTables)`]);
  }, [inputKey, memtable, sstables]);

  return (
    <div className="animate-in">
      <div className="page-header">
        <span className="category-tag">storage</span>
        <h1>SSTable</h1>
        <p className="subtitle">
          Sorted String Table — immutable, sorted key-value files. Binary search for O(log n) lookups.
        </p>
      </div>

      <div className="stats-row" style={{ marginBottom: 16 }}>
        <div className="stat">
          <span className="stat-label">memtable</span>
          <span className="stat-value">{memtable.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">SSTables</span>
          <span className="stat-value">{sstables.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">total keys</span>
          <span className="stat-value">
            {memtable.length + sstables.reduce((s, t) => s + t.entries.length, 0)}
          </span>
        </div>
      </div>

      <div className="viz-controls" style={{ marginBottom: 16 }}>
        <input value={inputKey} onChange={e => setInputKey(e.target.value)} placeholder="key" className="sim-input" onKeyDown={e => e.key === 'Enter' && put()} />
        <input value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="value" className="sim-input" />
        <button onClick={put} className="btn btn-accent">PUT</button>
        <button onClick={search} className="btn">SEARCH</button>
        <button onClick={flush} className="btn">Flush → SSTable</button>
      </div>

      {searchResult && (
        <div style={{
          padding: '8px 12px',
          marginBottom: 16,
          borderRadius: 'var(--radius)',
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
          background: searchResult.found ? 'var(--accent-glow)' : 'var(--danger-glow)',
          border: `1px solid ${searchResult.found ? 'var(--accent)' : 'var(--danger)'}`,
          color: searchResult.found ? 'var(--accent)' : 'var(--danger)'
        }}>
          {searchResult.found
            ? `✓ Found in ${searchResult.location}: "${searchResult.value}"`
            : `✗ NOT FOUND in ${searchResult.location}`
          }
        </div>
      )}

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
            🧠 Memtable (mutable, sorted) — {memtable.length} entries
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', minHeight: 20 }}>
            {memtable.length === 0 ? (
              <span style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic' }}>empty</span>
            ) : (
              memtable.map(e => (
                <span key={e.key} style={{
                  padding: '3px 8px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--accent)',
                  borderRadius: 4,
                  fontSize: 10,
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {e.key}={e.value}
                </span>
              ))
            )}
          </div>
        </div>

        {/* SSTables */}
        {sstables.length > 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 11, marginBottom: 8 }}>
            ↓ immutable on disk ↓
          </div>
        )}
        {sstables.map(sst => (
          <div key={sst.id} style={{
            padding: 12,
            marginBottom: 6,
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)'
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-bright)', marginBottom: 6 }}>
              💾 SSTable #{sst.id} (immutable, sorted) — {sst.entries.length} entries
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {sst.entries.map(e => (
                <span key={e.key} style={{
                  padding: '2px 6px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 3,
                  fontSize: 10,
                  color: 'var(--text-dim)',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {e.key}={e.value}
                </span>
              ))}
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
            <li>Data sorted by key within each SSTable</li>
            <li>SSTables are immutable once written</li>
            <li>Binary search within each file (O(log n))</li>
            <li>Search newest files first for latest value</li>
          </ul>
        </div>
        <div className="info-panel">
          <h3>Use Cases</h3>
          <ul style={{ fontSize: 12, lineHeight: 1.6 }}>
            <li>LevelDB, RocksDB, BigTable</li>
            <li>Building block for LSM trees</li>
            <li>Efficient range scans</li>
            <li>Compaction: merge multiple SSTables</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
