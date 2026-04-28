'use client';

import { useState, useCallback } from 'react';

interface Node { id: string; hasLock: boolean; waiting: boolean; }

export default function DistributedLockPage() {
    const [nodes, setNodes] = useState<Node[]>([
        { id: 'Node-A', hasLock: false, waiting: false },
        { id: 'Node-B', hasLock: false, waiting: false },
        { id: 'Node-C', hasLock: false, waiting: false },
    ]);
    const [lockHolder, setLockHolder] = useState<string | null>(null);
    const [log, setLog] = useState<string[]>([]);

    const acquire = useCallback((nodeId: string) => {
        if (lockHolder) {
            setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, waiting: true } : n));
            setLog(prev => [...prev.slice(-15), `${nodeId} → BLOCKED (lock held by ${lockHolder})`]);
        } else {
            setLockHolder(nodeId);
            setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, hasLock: true, waiting: false } : n));
            setLog(prev => [...prev.slice(-15), `${nodeId} → ACQUIRED lock`]);
        }
    }, [lockHolder]);

    const release = useCallback(() => {
        if (!lockHolder) return;
        const released = lockHolder;
        const waitingNode = nodes.find(n => n.waiting);
        if (waitingNode) {
            setLockHolder(waitingNode.id);
            setNodes(prev => prev.map(n => {
                if (n.id === released) return { ...n, hasLock: false };
                if (n.id === waitingNode.id) return { ...n, hasLock: true, waiting: false };
                return n;
            }));
            setLog(prev => [...prev.slice(-15), `${released} RELEASED → ${waitingNode.id} ACQUIRED`]);
        } else {
            setLockHolder(null);
            setNodes(prev => prev.map(n => n.id === released ? { ...n, hasLock: false } : n));
            setLog(prev => [...prev.slice(-15), `${released} RELEASED lock → free`]);
        }
    }, [lockHolder, nodes]);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">coordination</span>
                <h1>Distributed Lock</h1>
                <p className="subtitle">Mutual exclusion — only one node can hold the lock at a time.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                {nodes.map(n => (
                    <div key={n.id} style={{
                        padding: 12, textAlign: 'center', borderRadius: 'var(--radius)',
                        background: n.hasLock ? 'var(--accent-glow)' : n.waiting ? 'var(--warning-glow)' : 'var(--surface-2)',
                        border: `1px solid ${n.hasLock ? 'var(--accent)' : n.waiting ? 'var(--warning)' : 'var(--border)'}`,
                        cursor: 'pointer',
                    }} onClick={() => acquire(n.id)}>
                        <div style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{n.id}</div>
                        <div style={{ fontSize: 11, color: n.hasLock ? 'var(--accent)' : n.waiting ? 'var(--warning)' : 'var(--text-dim)' }}>
                            {n.hasLock ? '🔒 holding' : n.waiting ? '⏳ waiting' : 'idle'}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button onClick={release} className="sim-button" disabled={!lockHolder}>Release Lock</button>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', alignSelf: 'center' }}>Click a node to acquire. Lock: {lockHolder ?? 'free'}</span>
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
