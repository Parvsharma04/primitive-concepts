'use client';

import { useState, useCallback } from 'react';

type Mode = 'write-through' | 'write-back';

export default function WriteThroughBackPage() {
    const [mode, setMode] = useState<Mode>('write-through');
    const [cache, setCache] = useState<Record<string, string>>({});
    const [db, setDb] = useState<Record<string, string>>({});
    const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());
    const [inputKey, setInputKey] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [log, setLog] = useState<string[]>([]);

    const addLog = useCallback((msg: string) => {
        setLog(prev => [...prev.slice(-15), `[${new Date().toLocaleTimeString()}] ${msg}`]);
    }, []);

    const write = useCallback(() => {
        if (!inputKey.trim() || !inputValue.trim()) return;
        const key = inputKey.trim();
        const value = inputValue.trim();
        setCache(prev => ({ ...prev, [key]: value }));

        if (mode === 'write-through') {
            setDb(prev => ({ ...prev, [key]: value }));
            addLog(`WRITE-THROUGH "${key}"="${value}" → cache + DB updated synchronously`);
        } else {
            setDirtyKeys(prev => new Set(prev).add(key));
            addLog(`WRITE-BACK "${key}"="${value}" → cache updated, DB write deferred (dirty)`);
        }
        setInputKey('');
        setInputValue('');
    }, [inputKey, inputValue, mode, addLog]);

    const flush = useCallback(() => {
        dirtyKeys.forEach(key => {
            if (cache[key]) setDb(prev => ({ ...prev, [key]: cache[key] }));
        });
        addLog(`FLUSH → ${dirtyKeys.size} dirty keys written to DB`);
        setDirtyKeys(new Set());
    }, [dirtyKeys, cache, addLog]);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">caching</span>
                <h1>Write-Through / Write-Back</h1>
                <p className="subtitle">Compare synchronous vs deferred write strategies.</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button onClick={() => setMode('write-through')} className="sim-button" style={{ background: mode === 'write-through' ? 'var(--accent-glow)' : undefined }}>Write-Through</button>
                <button onClick={() => setMode('write-back')} className="sim-button" style={{ background: mode === 'write-back' ? 'var(--accent-glow)' : undefined }}>Write-Back</button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <input value={inputKey} onChange={e => setInputKey(e.target.value)} placeholder="key" className="sim-input" onKeyDown={e => e.key === 'Enter' && write()} />
                <input value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="value" className="sim-input" onKeyDown={e => e.key === 'Enter' && write()} />
                <button onClick={write} className="sim-button">WRITE</button>
                {mode === 'write-back' && <button onClick={flush} className="sim-button" style={{ borderColor: 'var(--warning)' }}>FLUSH ({dirtyKeys.size})</button>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="info-panel">
                    <h3>// cache</h3>
                    {Object.entries(cache).map(([k, v]) => (
                        <div key={k} style={{ fontSize: 12, padding: '2px 0', color: dirtyKeys.has(k) ? 'var(--warning)' : 'var(--accent)' }}>
                            {k}: {v} {dirtyKeys.has(k) && '(dirty)'}
                        </div>
                    ))}
                    {Object.keys(cache).length === 0 && <p style={{ color: 'var(--text-dim)', fontSize: 12 }}>empty</p>}
                </div>
                <div className="info-panel">
                    <h3>// database</h3>
                    {Object.entries(db).map(([k, v]) => (
                        <div key={k} style={{ fontSize: 12, padding: '2px 0', color: 'var(--text-dim)' }}>{k}: {v}</div>
                    ))}
                    {Object.keys(db).length === 0 && <p style={{ color: 'var(--text-dim)', fontSize: 12 }}>empty</p>}
                </div>
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
