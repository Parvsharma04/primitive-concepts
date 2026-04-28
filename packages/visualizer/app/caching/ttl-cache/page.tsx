'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface CacheEntry {
    key: string;
    value: string;
    createdAt: number;
    ttlMs: number;
}

export default function TTLCachePage() {
    const [ttlMs, setTtlMs] = useState(5000);
    const [cache, setCache] = useState<CacheEntry[]>([]);
    const [inputKey, setInputKey] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [events, setEvents] = useState<{ id: number; msg: string; type: 'insert' | 'expire' }[]>([]);
    const [now, setNow] = useState(Date.now());
    const animRef = useRef<number>(0);
    const nextId = useRef(0);
    const [totalExpired, setTotalExpired] = useState(0);

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
                    setEvents(evts => [...evts.slice(-20), { id: nextId.current++, msg: `EXPIRED "${e.key}" — TTL elapsed`, type: 'expire' }]);
                });
                setTotalExpired(t => t + expired.length);
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
        setEvents(prev => [...prev.slice(-20), { id: nextId.current++, msg: `PUT "${key}" — expires in ${ttlMs / 1000}s`, type: 'insert' }]);
        setInputKey('');
        setInputValue('');
    }, [inputKey, inputValue, ttlMs]);

    const reset = () => {
        setCache([]);
        setEvents([]);
        setTotalExpired(0);
    };

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">caching</span>
                <h1>TTL Cache</h1>
                <p className="subtitle">Time-To-Live — entries automatically expire after a configurable duration</p>
            </div>

            <div className="stats-row">
                <div className="stat">
                    <span className="stat-label">Active Entries</span>
                    <span className="stat-value accent">{cache.length}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">TTL</span>
                    <span className="stat-value warning">{ttlMs / 1000}s</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Total Expired</span>
                    <span className="stat-value danger">{totalExpired}</span>
                </div>
            </div>

            <div className="viz-container">
                <div className="viz-controls">
                    <input value={inputKey} onChange={e => setInputKey(e.target.value)} placeholder="key" className="sim-input" onKeyDown={e => e.key === 'Enter' && put()} />
                    <input value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="value (optional)" className="sim-input" onKeyDown={e => e.key === 'Enter' && put()} />
                    <button onClick={put} className="btn btn-accent">PUT</button>
                    <button onClick={reset} className="btn">Reset</button>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>TTL</span>
                        {[3000, 5000, 8000, 12000].map(t => (
                            <button key={t} onClick={() => setTtlMs(t)} className="btn" style={{
                                padding: '4px 8px',
                                borderColor: ttlMs === t ? 'var(--accent)' : undefined,
                                color: ttlMs === t ? 'var(--accent)' : undefined,
                            }}>{t / 1000}s</button>
                        ))}
                    </div>
                </div>

                {/* TTL countdown bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {cache.length === 0 && (
                        <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>No entries — add items and watch them expire</span>
                    )}
                    {cache.map(entry => {
                        const elapsed = now - entry.createdAt;
                        const remaining = Math.max(0, entry.ttlMs - elapsed);
                        const pct = remaining / entry.ttlMs;
                        const isUrgent = pct < 0.2;

                        return (
                            <div key={entry.key} style={{
                                background: 'var(--surface-2)', border: `1px solid ${isUrgent ? 'var(--danger)' : 'var(--border)'}`,
                                borderRadius: 'var(--radius)', padding: '10px 14px', position: 'relative', overflow: 'hidden',
                                transition: 'border-color 300ms ease',
                            }}>
                                {/* Background fill showing remaining time */}
                                <div style={{
                                    position: 'absolute', left: 0, top: 0, bottom: 0,
                                    width: `${pct * 100}%`,
                                    background: isUrgent
                                        ? 'linear-gradient(90deg, var(--danger-glow), transparent)'
                                        : 'linear-gradient(90deg, var(--accent-glow), transparent)',
                                    transition: 'width 0.1s linear',
                                }} />
                                <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <span style={{ fontWeight: 600, color: 'var(--text-bright)', marginRight: 8 }}>{entry.key}</span>
                                        <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>{entry.value}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        {/* Mini progress ring */}
                                        <svg width="24" height="24" style={{ transform: 'rotate(-90deg)' }}>
                                            <circle cx="12" cy="12" r="10" fill="none" stroke="var(--border)" strokeWidth="2" />
                                            <circle cx="12" cy="12" r="10" fill="none"
                                                stroke={isUrgent ? 'var(--danger)' : 'var(--accent)'}
                                                strokeWidth="2"
                                                strokeDasharray={`${pct * 62.83} 62.83`}
                                                style={{ transition: 'stroke-dasharray 0.1s linear' }}
                                            />
                                        </svg>
                                        <span style={{
                                            fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)',
                                            color: isUrgent ? 'var(--danger)' : 'var(--text-bright)',
                                            minWidth: 45, textAlign: 'right',
                                        }}>
                                            {(remaining / 1000).toFixed(1)}s
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="info-columns">
                <div className="info-panel">
                    <h3>// event log</h3>
                    <div className="log-area">
                        {events.length === 0 && <div className="log-entry">No events yet.</div>}
                        {events.slice(-12).reverse().map(e => (
                            <div key={e.id} className={`log-entry ${e.type === 'expire' ? 'rejected' : 'allowed'}`}>
                                {e.msg}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="info-panel">
                    <h3>// how it works</h3>
                    <ul>
                        <li>Each entry stores a creation timestamp + TTL</li>
                        <li>A background sweep checks for expired entries</li>
                        <li>Expired entries are automatically purged</li>
                        <li>No manual invalidation needed</li>
                        <li>Re-PUTting a key resets its TTL timer</li>
                    </ul>
                    <h3 style={{ marginTop: 12 }}>// trade-offs</h3>
                    <ul>
                        <li>Simple and predictable staleness bounds</li>
                        <li>Great for session data, DNS records</li>
                        <li className="con">Fixed TTL may not match actual data freshness</li>
                        <li className="con">Thundering herd on mass expiration</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
