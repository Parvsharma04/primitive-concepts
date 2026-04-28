'use client';

import { useState, useCallback, useRef } from 'react';

function hashKey(key: string, partitions: number): number {
    let h = 0;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
    return h % partitions;
}

export default function PartitionedLogPage() {
    const [partitionCount] = useState(4);
    const [partitions, setPartitions] = useState<string[][]>(Array.from({ length: 4 }, () => []));
    const [inputKey, setInputKey] = useState('');
    const [log, setLog] = useState<string[]>([]);
    const msgId = useRef(0);

    const append = useCallback(() => {
        const key = inputKey.trim() || `key_${Math.floor(Math.random() * 10)}`;
        const partition = hashKey(key, partitionCount);
        const payload = `${key}:${++msgId.current}`;
        setPartitions(prev => prev.map((p, i) => i === partition ? [...p.slice(-8), payload] : p));
        setLog(prev => [...prev.slice(-15), `APPEND "${payload}" → partition ${partition} (key="${key}")`]);
        setInputKey('');
    }, [inputKey, partitionCount]);

    const appendBurst = useCallback(() => { for (let i = 0; i < 8; i++) setTimeout(append, i * 100); }, [append]);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">messaging</span>
                <h1>Partitioned Log</h1>
                <p className="subtitle">Kafka-style append-only log — ordered within partition, parallel across partitions.</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <input value={inputKey} onChange={e => setInputKey(e.target.value)} placeholder="key (for partitioning)" className="sim-input" onKeyDown={e => e.key === 'Enter' && append()} />
                <button onClick={append} className="sim-button">Append</button>
                <button onClick={appendBurst} className="sim-button">Burst ×8</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${partitionCount}, 1fr)`, gap: 8, marginBottom: 16 }}>
                {partitions.map((p, i) => (
                    <div key={i} className="info-panel" style={{ padding: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--info)', marginBottom: 4 }}>Partition {i} ({p.length})</div>
                        {p.map((entry, j) => <div key={j} style={{ fontSize: 10, color: 'var(--text-dim)', padding: '1px 0' }}>[{j}] {entry}</div>)}
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
