'use client';

import { useState, useCallback } from 'react';

interface Replica { id: string; data: string; version: number; synced: boolean; }

export default function PrimaryReplicaPage() {
    const [primary, setPrimary] = useState({ data: 'initial', version: 0 });
    const [replicas, setReplicas] = useState<Replica[]>([
        { id: 'Replica-1', data: 'initial', version: 0, synced: true },
        { id: 'Replica-2', data: 'initial', version: 0, synced: true },
        { id: 'Replica-3', data: 'initial', version: 0, synced: true },
    ]);
    const [log, setLog] = useState<string[]>([]);

    const write = useCallback(() => {
        const newVersion = primary.version + 1;
        const newData = `data_v${newVersion}`;
        setPrimary({ data: newData, version: newVersion });
        setReplicas(prev => prev.map(r => ({ ...r, synced: false })));
        setLog(prev => [...prev.slice(-15), `WRITE → primary: "${newData}" (v${newVersion}) — replicas stale`]);

        // Simulate async replication
        replicas.forEach((r, i) => {
            setTimeout(() => {
                setReplicas(prev => prev.map((rep, j) => j === i ? { ...rep, data: newData, version: newVersion, synced: true } : rep));
                setLog(prev => [...prev.slice(-15), `REPLICATE → ${r.id} synced to v${newVersion}`]);
            }, 500 + i * 800);
        });
    }, [primary, replicas]);

    const read = useCallback((replicaId: string) => {
        const r = replicas.find(rep => rep.id === replicaId)!;
        setLog(prev => [...prev.slice(-15), `READ ${replicaId} → "${r.data}" (v${r.version}) ${r.synced ? '✓' : '⚠ stale!'}`]);
    }, [replicas]);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">consistency</span>
                <h1>Primary-Replica Replication</h1>
                <p className="subtitle">Writes go to primary, then replicate asynchronously. Reads from replicas may be stale.</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button onClick={write} className="sim-button">Write to Primary</button>
            </div>

            <div style={{ marginBottom: 16, padding: 12, background: 'var(--accent-glow)', border: '1px solid var(--accent)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                <div style={{ fontWeight: 600, color: 'var(--accent)' }}>PRIMARY</div>
                <div style={{ fontSize: 12, color: 'var(--text-bright)' }}>{primary.data} (v{primary.version})</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                {replicas.map(r => (
                    <div key={r.id} onClick={() => read(r.id)} style={{
                        padding: 12, textAlign: 'center', borderRadius: 'var(--radius)', cursor: 'pointer',
                        background: r.synced ? 'var(--surface-2)' : 'var(--warning-glow)',
                        border: `1px solid ${r.synced ? 'var(--border)' : 'var(--warning)'}`,
                    }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-bright)', fontSize: 12 }}>{r.id}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{r.data} (v{r.version})</div>
                        <div style={{ fontSize: 10, color: r.synced ? 'var(--accent)' : 'var(--warning)' }}>{r.synced ? '✓ synced' : '⏳ replicating'}</div>
                    </div>
                ))}
            </div>

            <p style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 16 }}>Click a replica to read from it.</p>

            <div className="info-panel">
                <h3>// event log</h3>
                <div style={{ maxHeight: 150, overflow: 'auto' }}>
                    {log.map((l, i) => <div key={i} style={{ fontSize: 11, color: 'var(--text-dim)', padding: '2px 0' }}>{l}</div>)}
                </div>
            </div>
        </div>
    );
}
