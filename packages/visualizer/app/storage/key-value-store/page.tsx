'use client';

import { useState, useCallback } from 'react';

export default function KeyValueStorePage() {
    const [store, setStore] = useState<Record<string, string>>({});
    const [inputKey, setInputKey] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [getResult, setGetResult] = useState<string | null>(null);
    const [log, setLog] = useState<string[]>([]);

    const put = useCallback(() => {
        if (!inputKey.trim()) return;
        setStore(prev => ({ ...prev, [inputKey.trim()]: inputValue.trim() }));
        setLog(prev => [...prev.slice(-15), `PUT "${inputKey.trim()}" = "${inputValue.trim()}"`]);
        setInputKey(''); setInputValue('');
    }, [inputKey, inputValue]);

    const get = useCallback(() => {
        if (!inputKey.trim()) return;
        const val = store[inputKey.trim()];
        setGetResult(val !== undefined ? val : 'NOT FOUND');
        setLog(prev => [...prev.slice(-15), `GET "${inputKey.trim()}" → ${val !== undefined ? `"${val}"` : 'NOT FOUND'}`]);
    }, [inputKey, store]);

    const del = useCallback(() => {
        if (!inputKey.trim()) return;
        setStore(prev => { const n = { ...prev }; delete n[inputKey.trim()]; return n; });
        setLog(prev => [...prev.slice(-15), `DELETE "${inputKey.trim()}"`]);
        setInputKey('');
    }, [inputKey]);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">storage</span>
                <h1>Key-Value Store</h1>
                <p className="subtitle">O(1) get/put/delete backed by a hash map.</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <input value={inputKey} onChange={e => setInputKey(e.target.value)} placeholder="key" className="sim-input" />
                <input value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="value" className="sim-input" />
                <button onClick={put} className="sim-button">PUT</button>
                <button onClick={get} className="sim-button">GET</button>
                <button onClick={del} className="sim-button">DEL</button>
            </div>

            {getResult && <div style={{ fontSize: 12, marginBottom: 12, padding: '6px 10px', background: 'var(--surface-2)', borderRadius: 'var(--radius)', color: getResult === 'NOT FOUND' ? 'var(--danger)' : 'var(--accent)' }}>→ {getResult}</div>}

            <div className="info-panel" style={{ marginBottom: 16 }}>
                <h3>// store ({Object.keys(store).length} entries)</h3>
                {Object.keys(store).length === 0 ? <p style={{ color: 'var(--text-dim)', fontSize: 12 }}>empty</p> :
                    Object.entries(store).map(([k, v]) => <div key={k} style={{ fontSize: 11, color: 'var(--text-dim)', padding: '2px 0' }}>{k}: &quot;{v}&quot;</div>)}
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
