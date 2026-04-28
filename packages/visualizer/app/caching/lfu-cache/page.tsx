'use client';

import { useState, useCallback, useRef } from 'react';

interface CacheEntry {
    key: string;
    value: string;
    frequency: number;
    insertOrder: number;
}

export default function LFUCachePage() {
    const [capacity, setCapacity] = useState(5);
    const [cache, setCache] = useState<CacheEntry[]>([]);
    const insertRef = useRef(0);
    const [inputKey, setInputKey] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [lastEvicted, setLastEvicted] = useState<string | null>(null);
    const [lastAccessed, setLastAccessed] = useState<string | null>(null);
    const [events, setEvents] = useState<{ id: number; msg: string; type: 'hit' | 'evict' | 'insert' }[]>([]);
    const nextId = useRef(0);

    const addEvent = useCallback((msg: string, type: 'hit' | 'evict' | 'insert') => {
        setEvents(prev => [...prev.slice(-20), { id: nextId.current++, msg, type }]);
    }, []);

    const put = useCallback(() => {
        if (!inputKey.trim()) return;
        const key = inputKey.trim();
        const value = inputValue.trim() || `val_${key}`;
        setLastEvicted(null);
        setLastAccessed(key);

        setCache(prev => {
            const existing = prev.find(e => e.key === key);
            if (existing) {
                addEvent(`PUT "${key}" → updated, freq ${existing.frequency} → ${existing.frequency + 1}`, 'hit');
                return prev.map(e => e.key === key ? { ...e, value, frequency: e.frequency + 1 } : e);
            }
            const newOrder = ++insertRef.current;
            if (prev.length >= capacity) {
                const minFreq = Math.min(...prev.map(e => e.frequency));
                const candidates = prev.filter(e => e.frequency === minFreq);
                const lfu = candidates.reduce((min, e) => e.insertOrder < min.insertOrder ? e : min, candidates[0]);
                setLastEvicted(lfu.key);
                addEvent(`EVICT "${lfu.key}" (freq=${lfu.frequency}, oldest among ties)`, 'evict');
                addEvent(`PUT "${key}" → inserted (freq=1)`, 'insert');
                return [...prev.filter(e => e.key !== lfu.key), { key, value, frequency: 1, insertOrder: newOrder }];
            }
            addEvent(`PUT "${key}" → inserted (freq=1)`, 'insert');
            return [...prev, { key, value, frequency: 1, insertOrder: newOrder }];
        });
        setInputKey('');
        setInputValue('');
    }, [inputKey, inputValue, capacity, addEvent]);

    const get = useCallback((key: string) => {
        setLastAccessed(key);
        setLastEvicted(null);
        setCache(prev => prev.map(e => e.key === key ? { ...e, frequency: e.frequency + 1 } : e));
        const entry = cache.find(e => e.key === key);
        addEvent(`GET "${key}" → freq ${(entry?.frequency ?? 0)} → ${(entry?.frequency ?? 0) + 1}`, 'hit');
    }, [cache, addEvent]);

    const reset = () => {
        setCache([]);
        setEvents([]);
        setLastEvicted(null);
        setLastAccessed(null);
        insertRef.current = 0;
    };

    // Sort by frequency ascending (lowest = eviction candidate)
    const sorted = [...cache].sort((a, b) => a.frequency - b.frequency || a.insertOrder - b.insertOrder);
    const maxFreq = cache.length > 0 ? Math.max(...cache.map(e => e.frequency)) : 1;
    const evictions = events.filter(e => e.type === 'evict').length;

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">caching</span>
                <h1>LFU Cache</h1>
                <p className="subtitle">Least Frequently Used — evicts the entry with the lowest access count</p>
            </div>

            <div className="stats-row">
                <div className="stat">
                    <span className="stat-label">Capacity</span>
                    <span className="stat-value accent">{cache.length} / {capacity}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Max Frequency</span>
                    <span className="stat-value accent">{cache.length > 0 ? maxFreq : 0}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Evictions</span>
                    <span className="stat-value danger">{evictions}</span>
                </div>
            </div>

            <div className="viz-container">
                <div className="viz-controls">
                    <input value={inputKey} onChange={e => setInputKey(e.target.value)} placeholder="key" className="sim-input" onKeyDown={e => e.key === 'Enter' && put()} />
                    <input value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="value (optional)" className="sim-input" onKeyDown={e => e.key === 'Enter' && put()} />
                    <button onClick={put} className="btn btn-accent">PUT</button>
                    <button onClick={reset} className="btn">Reset</button>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Cap</span>
                        {[3, 4, 5, 6].map(c => (
                            <button key={c} onClick={() => setCapacity(c)} className="btn" style={{
                                padding: '4px 8px',
                                borderColor: capacity === c ? 'var(--accent)' : undefined,
                                color: capacity === c ? 'var(--accent)' : undefined,
                            }}>{c}</button>
                        ))}
                    </div>
                </div>

                {/* Frequency histogram visualization */}
                <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 12 }}>
                        // frequency bars — click to access (↑ freq), lowest freq = eviction target
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, minHeight: 160, padding: '0 0 8px 0' }}>
                        {sorted.length === 0 && (
                            <span style={{ color: 'var(--text-dim)', fontSize: 12, alignSelf: 'center' }}>Cache empty — add items with PUT</span>
                        )}
                        {sorted.map((entry, i) => {
                            const barHeight = maxFreq > 0 ? (entry.frequency / maxFreq) * 120 : 20;
                            const isLowest = i === 0 && sorted.length >= capacity;
                            const isAccessed = entry.key === lastAccessed;

                            return (
                                <button
                                    key={entry.key}
                                    onClick={() => get(entry.key)}
                                    title={`Click to GET "${entry.key}" (freq +1)`}
                                    style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                                        transition: 'all var(--transition)',
                                    }}
                                >
                                    {/* Frequency count */}
                                    <span style={{
                                        fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
                                        color: isAccessed ? 'var(--accent)' : 'var(--text-bright)',
                                    }}>{entry.frequency}</span>
                                    {/* Bar */}
                                    <div style={{
                                        width: 48, height: Math.max(barHeight, 20), borderRadius: '4px 4px 0 0',
                                        background: isLowest ? 'var(--danger)' : isAccessed ? 'var(--accent)' : 'var(--info)',
                                        opacity: isLowest ? 0.8 : 0.6,
                                        border: `1px solid ${isLowest ? 'var(--danger)' : isAccessed ? 'var(--accent)' : 'var(--info)'}`,
                                        transition: 'height 300ms ease, background 200ms ease',
                                    }} />
                                    {/* Key label */}
                                    <span style={{
                                        fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600,
                                        color: isAccessed ? 'var(--accent)' : 'var(--text-bright)',
                                    }}>{entry.key}</span>
                                    <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>{entry.value}</span>
                                    {isLowest && (
                                        <span style={{ fontSize: 8, color: 'var(--danger)', fontWeight: 600 }}>← EVICT</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {lastEvicted && (
                    <div style={{ padding: '8px 12px', background: 'var(--danger-glow)', border: '1px solid var(--danger)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--danger)' }}>
                        ⊘ Evicted &quot;{lastEvicted}&quot; — it had the lowest access frequency
                    </div>
                )}
            </div>

            <div className="info-columns">
                <div className="info-panel">
                    <h3>// event log</h3>
                    <div className="log-area">
                        {events.length === 0 && <div className="log-entry">No events yet.</div>}
                        {events.slice(-12).reverse().map(e => (
                            <div key={e.id} className={`log-entry ${e.type === 'hit' ? 'allowed' : e.type === 'evict' ? 'rejected' : ''}`}>
                                {e.msg}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="info-panel">
                    <h3>// how it works</h3>
                    <ul>
                        <li>Each entry tracks an access frequency counter</li>
                        <li>GET and PUT increment the frequency</li>
                        <li>On eviction, the lowest frequency entry is removed</li>
                        <li>Ties broken by insertion order (oldest first)</li>
                        <li>O(1) with min-heap or frequency buckets</li>
                    </ul>
                    <h3 style={{ marginTop: 12 }}>// trade-offs</h3>
                    <ul>
                        <li>Better than LRU for skewed access patterns</li>
                        <li>Keeps genuinely hot data in cache</li>
                        <li className="con">New items start at freq=1, easily evicted</li>
                        <li className="con">Stale popular items can linger (no decay)</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
