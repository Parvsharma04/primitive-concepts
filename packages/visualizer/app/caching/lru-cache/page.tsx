'use client';

import { useState, useCallback } from 'react';

interface CacheEntry {
    key: string;
    value: string;
    accessOrder: number;
}

export default function LRUCachePage() {
    const [capacity] = useState(5);
    const [cache, setCache] = useState<CacheEntry[]>([]);
    const [accessCounter, setAccessCounter] = useState(0);
    const [inputKey, setInputKey] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [log, setLog] = useState<string[]>([]);
    const [lastEvicted, setLastEvicted] = useState<string | null>(null);
    const [lastAccessed, setLastAccessed] = useState<string | null>(null);

    const addLog = useCallback((msg: string) => {
        setLog(prev => [...prev.slice(-15), `[${new Date().toLocaleTimeString()}] ${msg}`]);
    }, []);

    const put = useCallback(() => {
        if (!inputKey.trim()) return;
        const key = inputKey.trim();
        const value = inputValue.trim() || `val_${key}`;
        const newAccess = accessCounter + 1;
        setAccessCounter(newAccess);
        setLastEvicted(null);
        setLastAccessed(key);

        setCache(prev => {
            const existing = prev.find(e => e.key === key);
            if (existing) {
                addLog(`PUT "${key}" → updated (moved to front)`);
                return prev.map(e => e.key === key ? { ...e, value, accessOrder: newAccess } : e);
            }
            if (prev.length >= capacity) {
                const lru = prev.reduce((min, e) => e.accessOrder < min.accessOrder ? e : min, prev[0]);
                setLastEvicted(lru.key);
                addLog(`PUT "${key}" → evicted "${lru.key}" (LRU), inserted`);
                return [...prev.filter(e => e.key !== lru.key), { key, value, accessOrder: newAccess }];
            }
            addLog(`PUT "${key}" → inserted`);
            return [...prev, { key, value, accessOrder: newAccess }];
        });
        setInputKey('');
        setInputValue('');
    }, [inputKey, inputValue, accessCounter, capacity, addLog]);

    const get = useCallback((key: string) => {
        const newAccess = accessCounter + 1;
        setAccessCounter(newAccess);
        setLastAccessed(key);
        setLastEvicted(null);
        setCache(prev => prev.map(e => e.key === key ? { ...e, accessOrder: newAccess } : e));
        addLog(`GET "${key}" → hit (moved to front)`);
    }, [accessCounter, addLog]);

    const sorted = [...cache].sort((a, b) => b.accessOrder - a.accessOrder);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">caching</span>
                <h1>LRU Cache</h1>
                <p className="subtitle">
                    Least Recently Used — evicts the entry that hasn&apos;t been accessed for the longest time when capacity is reached.
                </p>
            </div>

            <div className="info-panel" style={{ marginBottom: 24 }}>
                <h3>// how it works</h3>
                <p>Capacity: {capacity} items. On put, if full, the least recently used entry is evicted. On get, the accessed entry moves to the front.</p>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <input
                    value={inputKey}
                    onChange={e => setInputKey(e.target.value)}
                    placeholder="key"
                    className="sim-input"
                    onKeyDown={e => e.key === 'Enter' && put()}
                />
                <input
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    placeholder="value (optional)"
                    className="sim-input"
                    onKeyDown={e => e.key === 'Enter' && put()}
                />
                <button onClick={put} className="sim-button">PUT</button>
            </div>

            {/* Cache visualization */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {sorted.length === 0 && <span style={{ color: 'var(--text-dim)' }}>Cache empty — add items above</span>}
                {sorted.map((entry, i) => (
                    <button
                        key={entry.key}
                        onClick={() => get(entry.key)}
                        style={{
                            padding: '8px 12px',
                            background: entry.key === lastEvicted ? 'var(--danger-glow)' :
                                entry.key === lastAccessed ? 'var(--accent-glow)' :
                                    'var(--surface-2)',
                            border: `1px solid ${entry.key === lastAccessed ? 'var(--accent)' : 'var(--border)'}`,
                            borderRadius: 'var(--radius)',
                            color: 'var(--text-bright)',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 12,
                            transition: 'all var(--transition)',
                        }}
                        title={`Click to GET "${entry.key}"`}
                    >
                        <div style={{ fontWeight: 600 }}>{entry.key}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{entry.value}</div>
                        <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>#{i === 0 ? 'MRU' : i === sorted.length - 1 ? 'LRU' : i}</div>
                    </button>
                ))}
            </div>

            {lastEvicted && (
                <div style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 12 }}>
                    ⊘ Evicted: &quot;{lastEvicted}&quot;
                </div>
            )}

            {/* Log */}
            <div className="info-panel">
                <h3>// event log</h3>
                <div style={{ maxHeight: 200, overflow: 'auto' }}>
                    {log.map((l, i) => (
                        <div key={i} style={{ fontSize: 11, color: 'var(--text-dim)', padding: '2px 0' }}>{l}</div>
                    ))}
                </div>
            </div>
        </div>
    );
}
