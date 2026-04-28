'use client';

import { useState, useCallback } from 'react';

export default function ReadWriteQuorumPage() {
    const [N] = useState(5);
    const [W, setW] = useState(3);
    const [R, setR] = useState(3);
    const [nodes, setNodes] = useState(Array.from({ length: 5 }, (_, i) => ({ id: `N${i + 1}`, value: 'v0', version: 0 })));
    const [log, setLog] = useState<string[]>([]);
    const [writeHighlight, setWriteHighlight] = useState<number[]>([]);
    const [readHighlight, setReadHighlight] = useState<number[]>([]);

    const write = useCallback(() => {
        const newVersion = Math.max(...nodes.map(n => n.version)) + 1;
        const selected = Array.from({ length: N }, (_, i) => i).sort(() => Math.random() - 0.5).slice(0, W);
        setWriteHighlight(selected);
        setReadHighlight([]);
        setNodes(prev => prev.map((n, i) => selected.includes(i) ? { ...n, value: `v${newVersion}`, version: newVersion } : n));
        setLog(prev => [...prev.slice(-15), `WRITE v${newVersion} → nodes [${selected.map(i => `N${i + 1}`).join(',')}] (W=${W})`]);
    }, [N, W, nodes]);

    const read = useCallback(() => {
        const selected = Array.from({ length: N }, (_, i) => i).sort(() => Math.random() - 0.5).slice(0, R);
        setReadHighlight(selected);
        setWriteHighlight([]);
        const readValues = selected.map(i => nodes[i]);
        const latest = readValues.reduce((max, n) => n.version > max.version ? n : max, readValues[0]);
        setLog(prev => [...prev.slice(-15), `READ from [${selected.map(i => `N${i + 1}`).join(',')}] → latest: "${latest.value}" (R=${R})`]);
    }, [N, R, nodes]);

    const strongConsistency = W + R > N;

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">consistency</span>
                <h1>Read/Write Quorum</h1>
                <p className="subtitle">N={N}, W={W}, R={R} — {strongConsistency ? '✓ Strong consistency (W+R > N)' : '⚠ Eventual consistency (W+R ≤ N)'}</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <button onClick={write} className="sim-button">Write</button>
                <button onClick={read} className="sim-button">Read</button>
                <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>W: <input type="range" min="1" max={N} value={W} onChange={e => setW(Number(e.target.value))} style={{ width: 60 }} />{W}</label>
                <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>R: <input type="range" min="1" max={N} value={R} onChange={e => setR(Number(e.target.value))} style={{ width: 60 }} />{R}</label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${N}, 1fr)`, gap: 8, marginBottom: 16 }}>
                {nodes.map((n, i) => (
                    <div key={i} style={{
                        padding: 10, textAlign: 'center', borderRadius: 'var(--radius)',
                        background: writeHighlight.includes(i) ? 'var(--accent-glow)' : readHighlight.includes(i) ? 'var(--info-glow)' : 'var(--surface-2)',
                        border: `1px solid ${writeHighlight.includes(i) ? 'var(--accent)' : readHighlight.includes(i) ? 'var(--info)' : 'var(--border)'}`,
                    }}>
                        <div style={{ fontWeight: 600, fontSize: 11, color: 'var(--text-bright)' }}>{n.id}</div>
                        <div style={{ fontSize: 12, color: 'var(--accent)' }}>{n.value}</div>
                    </div>
                ))}
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
