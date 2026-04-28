'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface CacheEntry {
    key: string;
    value: string;
    createdAt: number;
    ttlMs: number;
}

export default function TTLCachePage() {
    const [ttlMs] = useState(5000);
    const [cache, setCache] = useState<CacheEntry[]>([]);
    const [inputKey, setInputKey] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [log, setLog] = useState<string[]>([]);
    const [now, setNow] = useState(Date.now());
    const animRef = useRef<number>(0);

    useEffect(() => {
        const tick = () => {
            setNow(Date.now());
            animRef.current = requestAnimationFrame(tick);
        };
        animRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(animRef.current);
    }, []);

    useEffect(() => {
        setCache(prev => {
            const expired = prev.filter(e => now >= e.createdAt + e.ttlMs);
            if (expired.length > 0) {
                expired.forEach(e => {
                    setLog(l => [...l.slice(-15), `[${new Date().toLocaleTimeString()}] EXPIRED "${e.key}"`]);
                });
                return prev.filter(e => now < e.createdAt + e.ttlMs);
            }
            return prev;
        });
    }, [now]);

    const put = useCallback(() => {
        if (!inputKey.trim()) return;
        const key = inputKey.trim();
        const value = inputValue.trim() || `val_${key}`;
        setCache(prev => [...prev.filter(e => e.key !== key), { key, value, createdAt: Date.now(), ttlMs }]);
        setLog(prev => [...prev.slice(-15), `[${new Date().toLocaleTimeString()}] PUT "${key}" (TTL=${ttlMs}ms)`]);
        setInputKey('');
        setInputValue('');
    }, [inputKey, inputValue, ttlMs]);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">caching</span>
                <h1>TTL Cache</h1>
                <p className="subtitle">Time-To-Live — entries automatically expire after {ttlMs / 1000}s.</p>
            </div>

            <div className="info-panel" style={{ marginBottom: 24 }}>
                <h3>// how it works</h3>
                <p>Each entry has a TTL. Once the TTL elapses, the entry is automatically removed. Watch the progress bars count down.</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <input value={inputKey} onChange={e => setInputKey(e.target.value)} placeholder="key" className="sim-input" onKeyDown={e => e.key === 'Enter' && put()} />
                <input value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="value" className="sim-input" onKeyDown={e => e.key === 'Enter' && put()} />
                <button onClick={put} className="sim-button">PUT</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {cache.length === 0 && <span style={{ color: 'var(--text-dim)' }}>Cache empty — add items above</span>}
                {cache.map(entry => {
                    const elapsed = now - entry.createdAt;
                    const remaining = Math.max(0, entry.ttlMs - elapsed);
                    const pct = remaining / entry.ttlMs;
                    return (
                        <div key={entry.key} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '8px 12px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct * 100}%`, background: 'var(--accent-glow)', transition: 'width 0.1s linear' }} />
                            <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{entry.key}: {entry.value}</span>
                                <span style={{ fontSize: 10, color: pct < 0.2 ? 'var(--danger)' : 'var(--text-dim)' }}>{(remaining / 1000).toFixed(1)}s left</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="info-panel">
                <h3>// event log</h3>
                <div style={{ maxHeight: 200, overflow: 'auto' }}>
                    {log.map((l, i) => <div key={i} style={{ fontSize: 11, color: 'var(--text-dim)', padding: '2px 0' }}>{l}</div>)}
                </div>
            </div>
        </div>
    );
}
