'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Node { id: string; lastHeartbeat: number; alive: boolean; paused: boolean; }
const TIMEOUT_MS = 3000;

export default function HeartbeatMonitorPage() {
    const [nodes, setNodes] = useState<Node[]>([
        { id: 'Node-A', lastHeartbeat: Date.now(), alive: true, paused: false },
        { id: 'Node-B', lastHeartbeat: Date.now(), alive: true, paused: false },
        { id: 'Node-C', lastHeartbeat: Date.now(), alive: true, paused: false },
    ]);
    const [log, setLog] = useState<string[]>([]);
    const [now, setNow] = useState(Date.now());
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        intervalRef.current = setInterval(() => {
            const t = Date.now();
            setNow(t);
            setNodes(prev => prev.map(n => {
                if (!n.paused && n.alive) return { ...n, lastHeartbeat: t };
                if (n.paused && n.alive && t - n.lastHeartbeat > TIMEOUT_MS) {
                    setLog(l => [...l.slice(-15), `⚠ ${n.id} TIMEOUT — marked dead`]);
                    return { ...n, alive: false };
                }
                return n;
            }));
        }, 1000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, []);

    const togglePause = useCallback((id: string) => {
        setNodes(prev => prev.map(n => n.id === id ? { ...n, paused: !n.paused, alive: !n.paused ? n.alive : true, lastHeartbeat: Date.now() } : n));
        setLog(prev => {
            const node = nodes.find(n => n.id === id)!;
            return [...prev.slice(-15), `${id} → ${node.paused ? 'RESUMED heartbeats' : 'PAUSED (will timeout)'}`];
        });
    }, [nodes]);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">coordination</span>
                <h1>Heartbeat Monitor</h1>
                <p className="subtitle">Nodes send periodic heartbeats. Missing heartbeats ({TIMEOUT_MS / 1000}s timeout) mark a node as dead.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                {nodes.map(n => {
                    const age = now - n.lastHeartbeat;
                    const pct = Math.min(age / TIMEOUT_MS, 1);
                    return (
                        <div key={n.id} onClick={() => togglePause(n.id)} style={{
                            padding: 12, textAlign: 'center', borderRadius: 'var(--radius)', cursor: 'pointer',
                            background: !n.alive ? 'var(--danger-glow)' : n.paused ? 'var(--warning-glow)' : 'var(--surface-2)',
                            border: `1px solid ${!n.alive ? 'var(--danger)' : n.paused ? 'var(--warning)' : 'var(--accent)'}`,
                        }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{n.id}</div>
                            <div style={{ fontSize: 11, color: !n.alive ? 'var(--danger)' : n.paused ? 'var(--warning)' : 'var(--accent)' }}>
                                {!n.alive ? '💀 dead' : n.paused ? '⏸ paused' : '💚 alive'}
                            </div>
                            {n.paused && n.alive && <div style={{ height: 3, background: 'var(--border)', marginTop: 4, borderRadius: 2 }}><div style={{ height: '100%', width: `${pct * 100}%`, background: 'var(--warning)', borderRadius: 2 }} /></div>}
                        </div>
                    );
                })}
            </div>

            <p style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 16 }}>Click a node to pause/resume heartbeats.</p>

            <div className="info-panel">
                <h3>// event log</h3>
                <div style={{ maxHeight: 150, overflow: 'auto' }}>
                    {log.map((l, i) => <div key={i} style={{ fontSize: 11, color: 'var(--text-dim)', padding: '2px 0' }}>{l}</div>)}
                </div>
            </div>
        </div>
    );
}
