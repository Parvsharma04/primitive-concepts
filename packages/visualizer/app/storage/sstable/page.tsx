'use client';

import { useState, useCallback } from 'react';

interface SSTableFile { id: number; entries: { key: string; value: string }[]; }

export default function SSTablePage() {
    const [memtable, setMemtable] = useState<{ key: string; value: string }[]>([]);
    const [sstables, setSstables] = useState<SSTableFile[]>([]);
    const [inputKey, setInputKey] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [log, setLog] = useState<string[]>([]);
    const [searchResult, setSearchResult] = useState<string | null>(null);

    const put = useCallback(() => {
        if (!inputKey.trim()) return;
        const entry = { key: inputKey.trim(), value: inputValue.trim() || `v_${inputKey.trim()}` };
        setMemtable(prev => [...prev.filter(e => e.key !== entry.key), entry].sort((a, b) => a.key.localeCompare(b.key)));
        setLog(prev => [...prev.slice(-15), `PUT "${entry.key}" → memtable`]);
        setInputKey(''); setInputValue('');
    }, [inputKey, inputValue]);

    const flush = useCallback(() => {
        if (memtable.length === 0) return;
        const newSST: SSTableFile = { id: sstables.length, entries: [...memtable] };
        setSstables(prev => [...prev, newSST]);
        setMemtable([]);
        setLog(prev => [...prev.slice(-15), `FLUSH memtable → SSTable #${newSST.id} (${newSST.entries.length} entries, sorted)`]);
    }, [memtable, sstables.length]);

    const search = useCallback(() => {
        if (!inputKey.trim()) return;
        const key = inputKey.trim();
        // Check memtable first
        const memHit = memtable.find(e => e.key === key);
        if (memHit) { setSearchResult(`Found in memtable: "${memHit.value}"`); setLog(prev => [...prev.slice(-15), `SEARCH "${key}" → memtable hit`]); return; }
        // Check SSTables newest first
        for (let i = sstables.length - 1; i >= 0; i--) {
            const hit = sstables[i].entries.find(e => e.key === key);
            if (hit) { setSearchResult(`Found in SSTable #${i}: "${hit.value}"`); setLog(prev => [...prev.slice(-15), `SEARCH "${key}" → SSTable #${i} hit`]); return; }
        }
        setSearchResult('NOT FOUND');
        setLog(prev => [...prev.slice(-15), `SEARCH "${key}" → not found`]);
    }, [inputKey, memtable, sstables]);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">storage</span>
                <h1>SSTable</h1>
                <p className="subtitle">Sorted String Table — immutable, sorted key-value files flushed from memory.</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <input value={inputKey} onChange={e => setInputKey(e.target.value)} placeholder="key" className="sim-input" onKeyDown={e => e.key === 'Enter' && put()} />
                <input value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="value" className="sim-input" />
                <button onClick={put} className="sim-button">PUT</button>
                <button onClick={search} className="sim-button">SEARCH</button>
                <button onClick={flush} className="sim-button" style={{ borderColor: 'var(--info)' }}>Flush to SSTable</button>
            </div>

            {searchResult && <div style={{ fontSize: 12, padding: '6px 10px', background: 'var(--surface-2)', borderRadius: 'var(--radius)', marginBottom: 12, color: searchResult.includes('NOT') ? 'var(--danger)' : 'var(--accent)' }}>{searchResult}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 16 }}>
                <div className="info-panel" style={{ padding: 8 }}>
                    <h3 style={{ fontSize: 11 }}>// memtable ({memtable.length})</h3>
                    {memtable.map(e => <div key={e.key} style={{ fontSize: 10, color: 'var(--accent)' }}>{e.key}: {e.value}</div>)}
                </div>
                <div className="info-panel" style={{ padding: 8 }}>
                    <h3 style={{ fontSize: 11 }}>// SSTables ({sstables.length} files)</h3>
                    {sstables.map(sst => (
                        <div key={sst.id} style={{ marginBottom: 4 }}>
                            <span style={{ fontSize: 10, color: 'var(--info)' }}>SSTable #{sst.id}: </span>
                            <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{sst.entries.map(e => e.key).join(', ')}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="info-panel">
                <h3>// event log</h3>
                <div style={{ maxHeight: 150, overflow: 'auto' }}>
                    {log.map((l, i) => <div key={i} style={{ fontSize: 11, color: 'var(--text-dim)', padding: '2px 0' }}>{l}</div>)}
                </div>
            </div>
        </div>
    );
}
