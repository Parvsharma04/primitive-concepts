'use client';

import { useState, useCallback } from 'react';

type VClock = Record<string, number>;
const NODES = ['A', 'B', 'C'];

export default function VectorClocksPage() {
    const [clocks, setClocks] = useState<Record<string, VClock>>({
        A: { A: 0, B: 0, C: 0 },
        B: { A: 0, B: 0, C: 0 },
        C: { A: 0, B: 0, C: 0 },
    });
    const [log, setLog] = useState<string[]>([]);

    const localEvent = useCallback((node: string) => {
        setClocks(prev => {
            const updated = { ...prev, [node]: { ...prev[node], [node]: prev[node][node] + 1 } };
            setLog(l => [...l.slice(-15), `${node} local event → [${NODES.map(n => updated[node][n]).join(',')}]`]);
            return updated;
        });
    }, []);

    const send = useCallback((from: string, to: string) => {
        setClocks(prev => {
            const fromClock = { ...prev[from], [from]: prev[from][from] + 1 };
            const toClock = { ...prev[to] };
            NODES.forEach(n => { toClock[n] = Math.max(toClock[n], fromClock[n]); });
            toClock[to] = toClock[to] + 1;
            const updated = { ...prev, [from]: fromClock, [to]: toClock };
            setLog(l => [...l.slice(-15), `${from}→${to}: ${from}=[${NODES.map(n => fromClock[n]).join(',')}] ${to}=[${NODES.map(n => toClock[n]).join(',')}]`]);
            return updated;
        });
    }, []);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">consistency</span>
                <h1>Vector Clocks</h1>
                <p className="subtitle">Track causal ordering across nodes. Each node maintains a vector of logical timestamps.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                {NODES.map(node => (
                    <div key={node} style={{ padding: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                        <div style={{ fontWeight: 600, color: 'var(--accent)', marginBottom: 4 }}>Node {node}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-bright)', marginBottom: 8 }}>[{NODES.map(n => clocks[node][n]).join(', ')}]</div>
                        <button onClick={() => localEvent(node)} className="sim-button" style={{ fontSize: 10, padding: '4px 8px' }}>Local Event</button>
                    </div>
                ))}
            </div>

            <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>Send message (syncs clocks):</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {NODES.flatMap(from => NODES.filter(to => to !== from).map(to => (
                        <button key={`${from}-${to}`} onClick={() => send(from, to)} className="sim-button" style={{ fontSize: 10, padding: '4px 8px' }}>{from}→{to}</button>
                    )))}
                </div>
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
