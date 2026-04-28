'use client';

import { useState, useCallback } from 'react';

interface LogEntry { id: number; msg: string; type: 'hit' | 'miss' | 'write' | 'info'; }

export default function CacheAsidePage() {
    const [db] = useState<Record<string, string>>({ user_1: 'Alice', user_2: 'Bob', user_3: 'Carol', user_4: 'Dave', user_5: 'Eve' });
    const [cache, setCache] = useState<Record<string, string>>({});
    const [log, setLog] = useState<LogEntry[]>([]);
    const [nextId, setNextId] = useState(0);
    const [queryKey, setQueryKey] = useState('');

    const addLog = useCallback((msg: string, type: LogEntry['type']) => {
        setNextId(prev => prev + 1);
        setLog(prev => [...prev.slice(-12), { id: nextId, msg, type }]);
    }, [nextId]);

    const read = useCallback(() => {
        const key = queryKey.trim();
        if (!key) return;
        if (cache[key]) {
            addLog(`GET "${key}" → CACHE HIT: "${cache[key]}"`, 'hit');
        } else if (db[key]) {
            addLog(`GET "${key}" → CACHE MISS → fetched from DB: "${db[key]}"`, 'miss');
            setCache(prev => ({ ...prev, [key]: db[key] }));
            addLog(`SET cache["${key}"] = "${db[key]}"`, 'write');
        } else {
            addLog(`GET "${key}" → NOT FOUND in cache or DB`, 'info');
        }
        setQueryKey('');
    }, [queryKey, cache, db, addLog]);

    const invalidate = useCallback((key: string) => {
        setCache(prev => { const n = { ...prev }; delete n[key]; return n; });
        addLog(`INVALIDATE "${key}" → removed from cache`, 'info');
    }, [addLog]);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">caching</span>
                <h1>Cache Aside</h1>
                <p className="subtitle">Read from cache first. On miss, load from DB and populate cache.</p>
            </div>

            <div className="info-panel" style={{ marginBottom: 24 }}>
                <h3>// how it works</h3>
                <p>1. Check cache → 2. If miss, query DB → 3. Populate cache → 4. Return. Try keys: user_1 through user_5.</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input value={queryKey} onChange={e => setQueryKey(e.target.value)} placeholder="key (e.g. user_1)" className="sim-input" onKeyDown={e => e.key === 'Enter' && read()} />
                <button onClick={read} className="sim-button">GET</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="info-panel">
                    <h3>// cache ({Object.keys(cache).length} entries)</h3>
                    {Object.keys(cache).length === 0 ? <p style={{ color: 'var(--text-dim)' }}>empty</p> :
                        Object.entries(cache).map(([k, v]) => (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
                                <span style={{ color: 'var(--accent)' }}>{k}: {v}</span>
                                <button onClick={() => invalidate(k)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 10 }}>✗</button>
                            </div>
                        ))}
                </div>
                <div className="info-panel">
                    <h3>// database</h3>
                    {Object.entries(db).map(([k, v]) => (
                        <div key={k} style={{ padding: '4px 0', fontSize: 12, color: 'var(--text-dim)' }}>{k}: {v}</div>
                    ))}
                </div>
            </div>

            <div className="info-panel">
                <h3>// event log</h3>
                <div style={{ maxHeight: 200, overflow: 'auto' }}>
                    {log.map(l => (
                        <div key={l.id} style={{ fontSize: 11, padding: '2px 0', color: l.type === 'hit' ? 'var(--accent)' : l.type === 'miss' ? 'var(--warning)' : 'var(--text-dim)' }}>{l.msg}</div>
                    ))}
                </div>
            </div>
        </div>
    );
}
