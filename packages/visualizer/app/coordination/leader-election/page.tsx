'use client';

import { useState, useCallback } from 'react';

interface Node { id: string; priority: number; alive: boolean; isLeader: boolean; }

export default function LeaderElectionPage() {
    const [nodes, setNodes] = useState<Node[]>([
        { id: 'Node-1', priority: 1, alive: true, isLeader: false },
        { id: 'Node-2', priority: 2, alive: true, isLeader: false },
        { id: 'Node-3', priority: 3, alive: true, isLeader: true },
    ]);
    const [log, setLog] = useState<string[]>([]);

    const elect = useCallback((nodeList: Node[]) => {
        const alive = nodeList.filter(n => n.alive);
        if (alive.length === 0) return nodeList;
        const leader = alive.reduce((max, n) => n.priority > max.priority ? n : max, alive[0]);
        setLog(prev => [...prev.slice(-15), `ELECTION → ${leader.id} elected (highest priority=${leader.priority})`]);
        return nodeList.map(n => ({ ...n, isLeader: n.id === leader.id && n.alive }));
    }, []);

    const toggleNode = useCallback((id: string) => {
        setNodes(prev => {
            const updated = prev.map(n => n.id === id ? { ...n, alive: !n.alive, isLeader: false } : n);
            const toggled = updated.find(n => n.id === id)!;
            setLog(l => [...l.slice(-15), `${id} → ${toggled.alive ? 'JOINED' : 'FAILED'}`]);
            return elect(updated);
        });
    }, [elect]);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">coordination</span>
                <h1>Leader Election</h1>
                <p className="subtitle">Elect the highest-priority alive node as leader. Toggle nodes to simulate failures.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                {nodes.map(n => (
                    <div key={n.id} onClick={() => toggleNode(n.id)} style={{
                        padding: 12, textAlign: 'center', borderRadius: 'var(--radius)', cursor: 'pointer',
                        background: !n.alive ? 'var(--danger-glow)' : n.isLeader ? 'var(--accent-glow)' : 'var(--surface-2)',
                        border: `1px solid ${!n.alive ? 'var(--danger)' : n.isLeader ? 'var(--accent)' : 'var(--border)'}`,
                        opacity: n.alive ? 1 : 0.5,
                    }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{n.id}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>priority: {n.priority}</div>
                        <div style={{ fontSize: 11, color: n.isLeader ? 'var(--accent)' : !n.alive ? 'var(--danger)' : 'var(--text-dim)', marginTop: 4 }}>
                            {!n.alive ? '💀 dead' : n.isLeader ? '👑 leader' : 'follower'}
                        </div>
                    </div>
                ))}
            </div>

            <p style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 16 }}>Click a node to toggle alive/dead. Elections run automatically.</p>

            <div className="info-panel">
                <h3>// event log</h3>
                <div style={{ maxHeight: 150, overflow: 'auto' }}>
                    {log.map((l, i) => <div key={i} style={{ fontSize: 11, color: 'var(--text-dim)', padding: '2px 0' }}>{l}</div>)}
                </div>
            </div>
        </div>
    );
}
