'use client';

import { useState, useCallback, useRef } from 'react';

interface CacheNode {
    key: string;
    value: string;
    accessOrder: number;
}

export default function LRUCachePage() {
    const [capacity, setCapacity] = useState(5);
    const [cache, setCache] = useState<CacheNode[]>([]);
    const accessRef = useRef(0);
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
        const newAccess = ++accessRef.current;
        setLastEvicted(null);
        setLastAccessed(key);

        setCache(prev => {
            const existing = prev.find(e => e.key === key);
            if (existing) {
                addEvent(`PUT "${key}" → updated, moved to MRU`, 'hit');
                return prev.map(e => e.key === key ? { ...e, value, accessOrder: newAccess } : e);
            }
            if (prev.length >= capacity) {
                const lru = prev.reduce((min, e) => e.accessOrder < min.accessOrder ? e : min, prev[0]);
                setLastEvicted(lru.key);
                addEvent(`EVICT "${lru.key}" (LRU position)`, 'evict');
                addEvent(`PUT "${key}" → inserted at MRU`, 'insert');
                return [...prev.filter(e => e.key !== lru.key), { key, value, accessOrder: newAccess }];
            }
            addEvent(`PUT "${key}" → inserted at MRU`, 'insert');
            return [...prev, { key, value, accessOrder: newAccess }];
        });
        setInputKey('');
        setInputValue('');
    }, [inputKey, inputValue, capacity, addEvent]);

    const get = useCallback((key: string) => {
        const newAccess = ++accessRef.current;
        setLastAccessed(key);
        setLastEvicted(null);
        setCache(prev => prev.map(e => e.key === key ? { ...e, accessOrder: newAccess } : e));
        addEvent(`GET "${key}" → cache hit, moved to MRU`, 'hit');
    }, [addEvent]);

    const reset = () => {
        setCache([]);
        setEvents([]);
        setLastEvicted(null);
        setLastAccessed(null);
        accessRef.current = 0;
    };

    const sorted = [...cache].sort((a, b) => b.accessOrder - a.accessOrder);
    const hits = events.filter(e => e.type === 'hit').length;
    const evictions = events.filter(e => e.type === 'evict').length;

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">caching</span>
                <h1>LRU Cache</h1>
                <p className="subtitle">Least Recently Used — evicts the entry that hasn&apos;t been accessed for the longest time</p>
            </div>

            <div className="stats-row">
                <div className="stat">
                    <span className="stat-label">Capacity</span>
                    <span className="stat-value accent">{cache.length} / {capacity}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Cache Hits</span>
                    <span className="stat-value accent">{hits}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Evictions</span>
                    <span className="stat-value danger">{evictions}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Fill Rate</span>
                    <span className="stat-value warning">{capacity > 0 ? ((cache.length / capacity) * 100).toFixed(0) : 0}%</span>
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

                {/* Doubly Linked List visualization */}
                <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 12 }}>
                        // doubly linked list — click a node to GET it
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', padding: '12px 0' }}>
                        {sorted.length === 0 && (
                            <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>Cache empty — add items with PUT</span>
                        )}
                        {sorted.map((entry, i) => {
                            const isLRU = i === sorted.length - 1;
                            const isMRU = i === 0;
                            const isAccessed = entry.key === lastAccessed;

                            return (
                                <div key={entry.key} style={{ display: 'flex', alignItems: 'center' }}>
                                    <button
                                        onClick={() => get(entry.key)}
                                        title={`Click to GET "${entry.key}"`}
                                        style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                                            padding: '12px 16px',
                                            background: isAccessed ? 'var(--accent-glow)' : 'var(--surface-2)',
                                            border: `1.5px solid ${isAccessed ? 'var(--accent)' : isLRU ? 'var(--danger)' : 'var(--border-bright)'}`,
                                            borderRadius: 'var(--radius)', cursor: 'pointer',
                                            transition: 'all var(--transition)', minWidth: 80, position: 'relative',
                                        }}
                                    >
                                        <span style={{
                                            position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)',
                                            fontSize: 9, padding: '1px 6px', borderRadius: 2,
                                            background: isMRU ? 'var(--accent)' : isLRU ? 'var(--danger)' : 'var(--surface)',
                                            color: isMRU || isLRU ? 'var(--bg)' : 'var(--text-dim)', fontWeight: 600,
                                        }}>
                                            {isMRU ? 'MRU' : isLRU ? 'LRU' : `#${i}`}
                                        </span>
                                        <span style={{ fontWeight: 600, color: 'var(--text-bright)', fontSize: 13 }}>{entry.key}</span>
                                        <span style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{entry.value}</span>
                                    </button>
                                    {i < sorted.length - 1 && (
                                        <div style={{ padding: '0 6px', color: 'var(--border-bright)', fontSize: 16 }}>⇄</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Capacity bar */}
                <div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>Cache Slots</div>
                    <div style={{
                        width: '100%', height: 24, background: 'var(--bg)',
                        border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', display: 'flex',
                    }}>
                        {Array.from({ length: capacity }, (_, i) => (
                            <div key={i} style={{
                                flex: 1, height: '100%',
                                background: i < cache.length ? 'var(--accent)' : 'transparent',
                                opacity: i < cache.length ? 0.5 : 1,
                                borderRight: i < capacity - 1 ? '1px solid var(--border)' : 'none',
                                transition: 'background 300ms ease',
                            }} />
                        ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-dim)', marginTop: 2 }}>
                        <span>0</span>
                        <span>{cache.length >= capacity ? 'FULL — next PUT evicts LRU' : `${capacity - cache.length} slots free`}</span>
                        <span>{capacity}</span>
                    </div>
                </div>

                {lastEvicted && (
                    <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--danger-glow)', border: '1px solid var(--danger)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--danger)' }}>
                        ⊘ Evicted &quot;{lastEvicted}&quot; — it was the least recently used entry
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
                        <li>Uses a HashMap + Doubly Linked List</li>
                        <li>GET moves accessed node to head (MRU)</li>
                        <li>PUT inserts at head; evicts tail (LRU) if full</li>
                        <li>Both GET and PUT are O(1) time</li>
                        <li>Click any node above to simulate GET</li>
                    </ul>
                    <h3 style={{ marginTop: 12 }}>// trade-offs</h3>
                    <ul>
                        <li>Great for temporal locality workloads</li>
                        <li>O(1) operations with constant space</li>
                        <li className="con">Doesn&apos;t consider access frequency</li>
                        <li className="con">Scan pollution (sequential access evicts hot data)</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
