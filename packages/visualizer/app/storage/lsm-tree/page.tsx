'use client';

import { useState, useCallback } from 'react';

const MEMTABLE_LIMIT = 4;

export default function LSMTreePage() {
    const [memtable, setMemtable] = useState<{ key: string; value: string }[]>([]);
    const [levels, setLevels] = useState<{ key: string; value: string }[][]>([[], []]);
    const [inputKey, setInputKey] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [log, setLog] = useState<string[]>([]);

    const put = useCallback(() => {
        if (!inputKey.trim()) return;
        const entry = { key: inputKey.trim(), value: inputValue.trim() || `v${Date.now()}` };

        setMemtable(prev => {
            const updated = [...prev.filter(e => e.key !== entry.key), entry].sort((a, b) => a.key.localeCompare(b.key));
            if (updated.length >= MEMTABLE_LIMIT) {
                // Auto-flush
                setLevels(prev => {
                    const l0 = [...prev[0], ...updated].sort((a, b) => a.key.localeCompare(b.key));
                    // Deduplicate keeping latest
                    const deduped = Object.values(Object.fromEntries(l0.map(e => [e.key, e])));
                    const sorted = deduped.sort((a, b) => a.key.localeCompare(b.key));
                    return [sorted, prev[1]];
                });
                setLog(l => [...l.slice(-15), `Memtable full → flushed to L0`]);
                return [];
            }
            return updated;
        });
        setLog(prev => [...prev.slice(-15), `PUT "${entry.key}" → memtable`]);
        setInputKey(''); setInputValue('');
    }, [inputKey, inputValue]);

    const compact = useCallback(() => {
        setLevels(prev => {
            if (prev[0].length === 0) return prev;
            const merged = [...prev[0], ...prev[1]];
            const deduped = Object.values(Object.fromEntries(merged.map(e => [e.key, e])));
            const sorted = deduped.sort((a, b) => a.key.localeCompare(b.key));
            setLog(l => [...l.slice(-15), `COMPACT: L0 merged into L1 (${sorted.length} entries)`]);
            return [[], sorted];
        });
    }, []);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">storage</span>
                <h1>LSM Tree</h1>
                <p className="subtitle">Write to memtable → flush to L0 when full → compact into deeper levels.</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <input value={inputKey} onChange={e => setInputKey(e.target.value)} placeholder="key" className="sim-input" onKeyDown={e => e.key === 'Enter' && put()} />
                <input value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="value" className="sim-input" />
                <button onClick={put} className="sim-button">PUT</button>
                <button onClick={compact} className="sim-button" style={{ borderColor: 'var(--info)' }}>Compact L0→L1</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                <div className="info-panel" style={{ padding: 8 }}>
                    <h3 style={{ fontSize: 11 }}>// memtable ({memtable.length}/{MEMTABLE_LIMIT})</h3>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {memtable.map(e => <span key={e.key} style={{ fontSize: 10, color: 'var(--accent)', padding: '2px 6px', background: 'var(--accent-glow)', borderRadius: 2 }}>{e.key}:{e.value}</span>)}
                    </div>
                </div>
                {levels.map((level, i) => (
                    <div key={i} className="info-panel" style={{ padding: 8 }}>
                        <h3 style={{ fontSize: 11 }}>// Level {i} ({level.length} entries)</h3>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {level.map(e => <span key={e.key} style={{ fontSize: 10, color: 'var(--text-dim)', padding: '2px 6px', background: 'var(--surface)', borderRadius: 2, border: '1px solid var(--border)' }}>{e.key}:{e.value}</span>)}
                        </div>
                    </div>
                ))}
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
