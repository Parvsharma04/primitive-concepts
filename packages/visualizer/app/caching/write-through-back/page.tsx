'use client';

import { useState, useCallback, useRef } from 'react';

type Mode = 'write-through' | 'write-back';

interface WriteOp { id: number; key: string; value: string; mode: Mode; flushed: boolean; }

export default function WriteThroughBackPage() {
    const [mode, setMode] = useState<Mode>('write-through');
    const [cache, setCache] = useState<Record<string, string>>({});
    const [db, setDb] = useState<Record<string, string>>({});
    const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());
    const [inputKey, setInputKey] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [events, setEvents] = useState<{ id: number; msg: string; type: 'write' | 'flush' | 'info' }[]>([]);
    const [writeOps, setWriteOps] = useState<WriteOp[]>([]);
    const nextId = useRef(0);

    const addEvent = useCallback((msg: string, type: 'write' | 'flush' | 'info') => {
        setEvents(prev => [...prev.slice(-20), { id: nextId.current++, msg, type }]);
    }, []);

    const write = useCallback(() => {
        if (!inputKey.trim() || !inputValue.trim()) return;
        const key = inputKey.trim();
        const value = inputValue.trim();
        setCache(prev => ({ ...prev, [key]: value }));

        if (mode === 'write-through') {
            setDb(prev => ({ ...prev, [key]: value }));
            addEvent(`WRITE "${key}"="${value}" → cache ✓ + DB ✓ (synchronous)`, 'write');
            setWriteOps(prev => [...prev.slice(-10), { id: nextId.current++, key, value, mode, flushed: true }]);
        } else {
            setDirtyKeys(prev => new Set(prev).add(key));
            addEvent(`WRITE "${key}"="${value}" → cache ✓ + DB deferred (dirty)`, 'write');
            setWriteOps(prev => [...prev.slice(-10), { id: nextId.current++, key, value, mode, flushed: false }]);
        }
        setInputKey('');
        setInputValue('');
    }, [inputKey, inputValue, mode, addEvent]);

    const flush = useCallback(() => {
        const count = dirtyKeys.size;
        dirtyKeys.forEach(key => {
            if (cache[key]) setDb(prev => ({ ...prev, [key]: cache[key] }));
        });
        setWriteOps(prev => prev.map(op => dirtyKeys.has(op.key) ? { ...op, flushed: true } : op));
        addEvent(`FLUSH → ${count} dirty keys persisted to DB`, 'flush');
        setDirtyKeys(new Set());
    }, [dirtyKeys, cache, addEvent]);

    const reset = () => {
        setCache({});
        setDb({});
        setDirtyKeys(new Set());
        setEvents([]);
        setWriteOps([]);
    };

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">caching</span>
                <h1>Write-Through / Write-Back</h1>
                <p className="subtitle">Compare synchronous vs deferred write strategies for cache consistency</p>
            </div>

            <div className="stats-row">
                <div className="stat">
                    <span className="stat-label">Mode</span>
                    <span className={`stat-value ${mode === 'write-through' ? 'accent' : 'warning'}`}>
                        {mode === 'write-through' ? 'Through' : 'Back'}
                    </span>
                </div>
                <div className="stat">
                    <span className="stat-label">Cache Keys</span>
                    <span className="stat-value accent">{Object.keys(cache).length}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">DB Keys</span>
                    <span className="stat-value">{Object.keys(db).length}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Dirty Keys</span>
                    <span className="stat-value danger">{dirtyKeys.size}</span>
                </div>
            </div>

            <div className="viz-container">
                <div className="viz-controls">
                    <button onClick={() => setMode('write-through')} className={`btn ${mode === 'write-through' ? 'btn-accent' : ''}`}>
                        Write-Through
                    </button>
                    <button onClick={() => setMode('write-back')} className={`btn ${mode === 'write-back' ? 'btn-accent' : ''}`}>
                        Write-Back
                    </button>
                    <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
                    <input value={inputKey} onChange={e => setInputKey(e.target.value)} placeholder="key" className="sim-input" onKeyDown={e => e.key === 'Enter' && write()} />
                    <input value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="value" className="sim-input" onKeyDown={e => e.key === 'Enter' && write()} />
                    <button onClick={write} className="btn btn-accent">WRITE</button>
                    {mode === 'write-back' && dirtyKeys.size > 0 && (
                        <button onClick={flush} className="btn btn-danger">FLUSH ({dirtyKeys.size})</button>
                    )}
                    <button onClick={reset} className="btn" style={{ marginLeft: 'auto' }}>Reset</button>
                </div>

                {/* Flow diagram */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '20px 0', marginBottom: 16 }}>
                    <div style={{ padding: '14px 18px', borderRadius: 'var(--radius)', border: '2px solid var(--accent)', background: 'var(--accent-glow)', textAlign: 'center', minWidth: 80 }}>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>App</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', marginTop: 2 }}>WRITE</div>
                    </div>

                    <div style={{ fontSize: 18, color: 'var(--accent)' }}>→</div>

                    <div style={{ padding: '14px 18px', borderRadius: 'var(--radius)', border: '2px solid var(--info)', background: 'var(--info-glow)', textAlign: 'center', minWidth: 80 }}>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Cache</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--info)', marginTop: 2 }}>always ✓</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: 18, color: mode === 'write-through' ? 'var(--accent)' : 'var(--warning)' }}>→</span>
                        <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>
                            {mode === 'write-through' ? 'sync' : 'deferred'}
                        </span>
                    </div>

                    <div style={{
                        padding: '14px 18px', borderRadius: 'var(--radius)', textAlign: 'center', minWidth: 80,
                        border: `2px solid ${mode === 'write-through' ? 'var(--accent)' : dirtyKeys.size > 0 ? 'var(--warning)' : 'var(--border-bright)'}`,
                        background: mode === 'write-through' ? 'var(--accent-glow)' : dirtyKeys.size > 0 ? 'var(--warning-glow)' : 'var(--surface-2)',
                    }}>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Database</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: mode === 'write-through' ? 'var(--accent)' : dirtyKeys.size > 0 ? 'var(--warning)' : 'var(--text-dim)', marginTop: 2 }}>
                            {mode === 'write-through' ? 'sync ✓' : dirtyKeys.size > 0 ? `${dirtyKeys.size} pending` : 'ok'}
                        </div>
                    </div>
                </div>

                {/* Cache vs DB comparison */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 12 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>// cache</div>
                        {Object.keys(cache).length === 0
                            ? <div style={{ color: 'var(--text-dim)', fontSize: 11 }}>empty</div>
                            : Object.entries(cache).map(([k, v]) => (
                                <div key={k} style={{ fontSize: 12, padding: '3px 0', color: dirtyKeys.has(k) ? 'var(--warning)' : 'var(--accent)' }}>
                                    {k}: {v} {dirtyKeys.has(k) && <span style={{ fontSize: 9, background: 'var(--warning-glow)', padding: '1px 4px', borderRadius: 2 }}>dirty</span>}
                                </div>
                            ))
                        }
                    </div>
                    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 12 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>// database</div>
                        {Object.keys(db).length === 0
                            ? <div style={{ color: 'var(--text-dim)', fontSize: 11 }}>empty</div>
                            : Object.entries(db).map(([k, v]) => (
                                <div key={k} style={{ fontSize: 12, padding: '3px 0', color: 'var(--text-dim)' }}>
                                    {k}: {v}
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>

            <div className="info-columns">
                <div className="info-panel">
                    <h3>// event log</h3>
                    <div className="log-area">
                        {events.length === 0 && <div className="log-entry">No events yet.</div>}
                        {events.slice(-12).reverse().map(e => (
                            <div key={e.id} className={`log-entry ${e.type === 'flush' ? 'allowed' : ''}`}>
                                {e.msg}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="info-panel">
                    <h3>// write-through</h3>
                    <ul>
                        <li>Writes go to both cache and DB synchronously</li>
                        <li>Strong consistency — DB always up-to-date</li>
                        <li className="con">Higher write latency (waits for DB)</li>
                    </ul>
                    <h3 style={{ marginTop: 12 }}>// write-back</h3>
                    <ul>
                        <li>Writes go to cache only; DB updated later</li>
                        <li>Much lower write latency</li>
                        <li className="con">Risk of data loss if cache crashes</li>
                        <li className="con">DB temporarily inconsistent (dirty keys)</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
