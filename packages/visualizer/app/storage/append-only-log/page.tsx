'use client';

import { useState, useCallback } from 'react';

interface LogEntry { offset: number; timestamp: number; data: string; }

export default function AppendOnlyLogPage() {
    const [entries, setEntries] = useState<LogEntry[]>([]);
    const [inputData, setInputData] = useState('');

    const append = useCallback(() => {
        const data = inputData.trim() || `event_${entries.length}`;
        setEntries(prev => [...prev, { offset: prev.length, timestamp: Date.now(), data }]);
        setInputData('');
    }, [inputData, entries.length]);

    const appendBurst = useCallback(() => {
        for (let i = 0; i < 5; i++) setTimeout(() => {
            setEntries(prev => [...prev, { offset: prev.length, timestamp: Date.now(), data: `batch_${prev.length}` }]);
        }, i * 100);
    }, []);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">storage</span>
                <h1>Append-Only Log</h1>
                <p className="subtitle">Immutable sequential writes — data is only ever appended, never modified.</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input value={inputData} onChange={e => setInputData(e.target.value)} placeholder="data to append" className="sim-input" onKeyDown={e => e.key === 'Enter' && append()} />
                <button onClick={append} className="sim-button">Append</button>
                <button onClick={appendBurst} className="sim-button">Burst ×5</button>
            </div>

            <div className="info-panel">
                <h3>// log ({entries.length} entries)</h3>
                <div style={{ maxHeight: 300, overflow: 'auto' }}>
                    {entries.length === 0 ? <p style={{ color: 'var(--text-dim)', fontSize: 12 }}>empty — append entries above</p> :
                        entries.map(e => (
                            <div key={e.offset} style={{ fontSize: 11, padding: '3px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12 }}>
                                <span style={{ color: 'var(--text-dim)', minWidth: 40 }}>[{e.offset}]</span>
                                <span style={{ color: 'var(--text-dim)', minWidth: 80 }}>{new Date(e.timestamp).toLocaleTimeString()}</span>
                                <span style={{ color: 'var(--accent)' }}>{e.data}</span>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
}
