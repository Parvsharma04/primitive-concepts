'use client';

import { useState, useCallback } from 'react';

interface CacheEntry {
    key: string;
    value: string;
    frequency: number;
    insertOrder: number;
}

export default function LFUCachePage() {
    const [capacity] = useState(5);
    const [cache, setCache] = useState<CacheEntry[]>([]);
    const [insertCounter, setInsertCounter] = useState(0);
    const [inputKey, setInputKey] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [log, setLog] = useState<string[]>([]);
    const [lastEvicted, setLastEvicted] = useState<string | null>(null);

    const addLog = useCallback((msg: string) => {
        setLog(prev => [...prev.slice(-15), `[${new Date().toLocaleTimeString()}] ${msg}`]);
    }, []);

    const put = useCallback(() => {
        if (!inputKey.trim()) return;
        const key = inputKey.trim();
        const value = inputValue.trim() || `val_${key}`;
        setLastEvicted(null);

        setCache(prev => {
            const existing = prev.find(e => e.key === key);
            if (existing) {
                addLog(`PUT "${key}" → updated, freq ${existing.frequency + 1}`);
                return prev.map(e => e.key === key ? { ...e, value, frequency: e.frequency + 1 } : e);
            }
            const newOrder = insertCounter + 1;
            setInsertCounter(newOrder);
            if (prev.length >= capacity) {
                const minFreq = Math.min(...prev.map(e => e.frequency));
                const candidates = prev.filter(e => e.frequency === minFreq);
                const lfu = candidates.reduce((min, e) => e.insertOrder < min.insertOrder ? e : min, candidates[0]);
                setLastEvicted(lfu.key);
                addLog(`PUT "${key}" → evicted "${lfu.key}" (freq=${lfu.frequency}), inserted`);
                return [...prev.filter(e => e.key !== lfu.key), { key, value, frequency: 1, insertOrder: newOrder }];
            }
            addLog(`PUT "${key}" → inserted`);
            return [...prev, { key, value, frequency: 1, insertOrder: newOrder }];
        });
        setInputKey('');
        setInputValue('');
    }, [inputKey, inputValue, capacity, insertCounter, addLog]);

    const get = useCallback((key: string) => {
        setCache(prev => prev.map(e => e.key === key ? { ...e, frequency: e.frequency + 1 } : e));
        const entry = cache.find(e => e.key === key);
        addLog(`GET "${key}" → freq ${(entry?.frequency ?? 0) + 1}`);
    }, [cache, addLog]);

    const sorted = [...cache].sort((a, b) => a.frequency - b.frequency || a.insertOrder - b.insertOrder);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">caching</span>
                <h1>LFU Cache</h1>
                <p className="subtitle">
                    Least Frequently Used — evicts the entry with the lowest access frequency. Ties broken by insertion order.
                </p>
            </div>

            <div className="info-panel" style={{ marginBottom: 24 }}>
                <h3>// how it works</h3>
                <p>Capacity: {capacity}. Each access increments frequency. On eviction, the lowest-frequency item is removed. Click an item to simulate GET.</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <input value={inputKey} onChange={e => setInputKey(e.target.value)} placeholder="key" className="sim-input" onKeyDown={e => e.key === 'Enter' && put()} />
                <input value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="value" className="sim-input" onKeyDown={e => e.key === 'Enter' && put()} />
                <button onClick={put} className="sim-button">PUT</button>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {sorted.length === 0 && <span style={{ color: 'var(--text-dim)' }}>Cache empty</span>}
                {sorted.map(entry => (
                    <button key={entry.key} onClick={() => get(entry.key)} style={{
                        padding: '8px 12px',
                        background: entry.key === lastEvicted ? 'var(--danger-glow)' : 'var(--surface-2)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        color: 'var(--text-bright)',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                    }} title={`Click to GET "${entry.key}"`}>
                        <div style={{ fontWeight: 600 }}>{entry.key}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{entry.value}</div>
                        <div style={{ fontSize: 9, color: 'var(--accent)' }}>freq: {entry.frequency}</div>
                    </button>
                ))}
            </div>

            {lastEvicted && <div style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 12 }}>⊘ Evicted: &quot;{lastEvicted}&quot;</div>}

            <div className="info-panel">
                <h3>// event log</h3>
                <div style={{ maxHeight: 200, overflow: 'auto' }}>
                    {log.map((l, i) => <div key={i} style={{ fontSize: 11, color: 'var(--text-dim)', padding: '2px 0' }}>{l}</div>)}
                </div>
            </div>
        </div>
    );
}
