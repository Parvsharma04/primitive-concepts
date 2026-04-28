'use client';

import { useState, useCallback } from 'react';

const NODES = ['A', 'B', 'C'];

export default function CRDTCountersPage() {
    const [increments, setIncrements] = useState<Record<string, number>>({ A: 0, B: 0, C: 0 });
    const [decrements, setDecrements] = useState<Record<string, number>>({ A: 0, B: 0, C: 0 });
    const [log, setLog] = useState<string[]>([]);

    const totalValue = Object.values(increments).reduce((a, b) => a + b, 0) - Object.values(decrements).reduce((a, b) => a + b, 0);

    const increment = useCallback((node: string) => {
        setIncrements(prev => ({ ...prev, [node]: prev[node] + 1 }));
        setLog(prev => [...prev.slice(-15), `${node} INCREMENT → local: ${increments[node] + 1}`]);
    }, [increments]);

    const decrement = useCallback((node: string) => {
        setDecrements(prev => ({ ...prev, [node]: prev[node] + 1 }));
        setLog(prev => [...prev.slice(-15), `${node} DECREMENT → local: ${decrements[node] + 1}`]);
    }, [decrements]);

    const merge = useCallback(() => {
        setLog(prev => [...prev.slice(-15), `MERGE → all nodes converge to value: ${totalValue}`]);
    }, [totalValue]);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">consistency</span>
                <h1>CRDT Counters</h1>
                <p className="subtitle">PN-Counter: each node tracks its own increments and decrements. Merging takes max of each.</p>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 16, padding: 16, background: 'var(--surface-2)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Global Counter Value</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>{totalValue}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                {NODES.map(node => (
                    <div key={node} style={{ padding: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-bright)', marginBottom: 4 }}>Node {node}</div>
                        <div style={{ fontSize: 11, color: 'var(--accent)' }}>+{increments[node]}</div>
                        <div style={{ fontSize: 11, color: 'var(--danger)' }}>-{decrements[node]}</div>
                        <div style={{ display: 'flex', gap: 4, marginTop: 8, justifyContent: 'center' }}>
                            <button onClick={() => increment(node)} className="sim-button" style={{ fontSize: 10, padding: '4px 8px' }}>+1</button>
                            <button onClick={() => decrement(node)} className="sim-button" style={{ fontSize: 10, padding: '4px 8px' }}>-1</button>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button onClick={merge} className="sim-button">Merge (sync all)</button>
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
