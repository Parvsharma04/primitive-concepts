'use client';

import { useState, useCallback, useRef } from 'react';

function hashKey(key: string, partitions: number): number {
    let h = 0;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
    return h % partitions;
}

const PARTITION_COLORS = ['var(--accent)', 'var(--info)', 'var(--warning)', 'var(--danger)'];

export default function PartitionedLogPage() {
    const [partitionCount] = useState(4);
    const [partitions, setPartitions] = useState<{ key: string; payload: string }[][]>(Array.from({ length: 4 }, () => []));
    const [inputKey, setInputKey] = useState('');
    const [events, setEvents] = useState<{ id: number; msg: string; partition: number }[]>([]);
    const [lastPartition, setLastPartition] = useState<number | null>(null);
    const msgId = useRef(0);
    const eventId = useRef(0);

    const append = useCallback(() => {
        const key = inputKey.trim() || `key_${Math.floor(Math.random() * 8)}`;
        const partition = hashKey(key, partitionCount);
        const payload = `${key}:${++msgId.current}`;
        setPartitions(prev => prev.map((p, i) => i === partition ? [...p.slice(-10), { key, payload }] : p));
        setLastPartition(partition);
        setEvents(prev => [...prev.slice(-20), { id: eventId.current++, msg: `APPEND "${payload}" → partition ${partition} (hash("${key}") % ${partitionCount})`, partition }]);
        setInputKey('');
    }, [inputKey, partitionCount]);

    const appendBurst = useCallback(() => {
        const keys = ['user', 'order', 'payment', 'session', 'event', 'log', 'metric', 'alert'];
        keys.forEach((k, i) => setTimeout(() => {
            const partition = hashKey(k, partitionCount);
            const payload = `${k}:${++msgId.current}`;
            setPartitions(prev => prev.map((p, idx) => idx === partition ? [...p.slice(-10), { key: k, payload }] : p));
            setLastPartition(partition);
            setEvents(prev => [...prev.slice(-20), { id: eventId.current++, msg: `APPEND "${payload}" → P${partition}`, partition }]);
        }, i * 100));
    }, [partitionCount]);

    const reset = () => { setPartitions(Array.from({ length: partitionCount }, () => [])); setEvents([]); setLastPartition(null); };

    const totalMessages = partitions.reduce((s, p) => s + p.length, 0);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">messaging</span>
                <h1>Partitioned Log</h1>
                <p className="subtitle">Kafka-style append-only log — ordered within each partition, parallel across partitions</p>
            </div>

            <div className="stats-row">
                <div className="stat">
                    <span className="stat-label">Partitions</span>
                    <span className="stat-value">{partitionCount}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Total Messages</span>
                    <span className="stat-value accent">{totalMessages}</span>
                </div>
                {partitions.map((p, i) => (
                    <div className="stat" key={i}>
                        <span className="stat-label">P{i}</span>
                        <span className="stat-value" style={{ color: PARTITION_COLORS[i] }}>{p.length}</span>
                    </div>
                ))}
            </div>

            <div className="viz-container">
                <div className="viz-controls">
                    <input value={inputKey} onChange={e => setInputKey(e.target.value)} placeholder="partition key (or random)" className="sim-input" onKeyDown={e => e.key === 'Enter' && append()} />
                    <button onClick={append} className="btn btn-accent">Append</button>
                    <button onClick={appendBurst} className="btn">Burst (8 keys)</button>
                    <button onClick={reset} className="btn" style={{ marginLeft: 'auto' }}>Reset</button>
                </div>

                {/* Partition logs visualization */}
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${partitionCount}, 1fr)`, gap: 12, marginBottom: 16 }}>
                    {partitions.map((p, i) => {
                        const isActive = i === lastPartition;
                        return (
                            <div key={i} style={{
                                background: 'var(--bg)', borderRadius: 'var(--radius)', padding: 12,
                                border: `1.5px solid ${isActive ? PARTITION_COLORS[i] : 'var(--border)'}`,
                                transition: 'border-color var(--transition)',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: PARTITION_COLORS[i] }}>Partition {i}</span>
                                    <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>offset: {p.length}</span>
                                </div>
                                {/* Log entries as append-only stack */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 180, overflowY: 'auto' }}>
                                    {p.length === 0 && <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>empty</span>}
                                    {p.map((entry, j) => (
                                        <div key={j} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '3px 6px', borderRadius: 2, fontSize: 9, fontFamily: 'var(--font-mono)',
                                            background: j === p.length - 1 && isActive ? `${PARTITION_COLORS[i]}20` : 'var(--surface-2)',
                                            border: `1px solid ${j === p.length - 1 && isActive ? PARTITION_COLORS[i] : 'var(--border)'}`,
                                        }}>
                                            <span style={{ color: 'var(--text-dim)' }}>[{j}]</span>
                                            <span style={{ color: 'var(--text-bright)' }}>{entry.payload}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Key routing explanation */}
                <div style={{ padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 'var(--radius)', fontSize: 11, color: 'var(--text-dim)' }}>
                    Routing: hash(key) % {partitionCount} → same key always goes to same partition → ordering preserved per key
                </div>
            </div>

            <div className="info-columns">
                <div className="info-panel">
                    <h3>// event log</h3>
                    <div className="log-area">
                        {events.length === 0 && <div className="log-entry">No events yet.</div>}
                        {events.slice(-12).reverse().map(e => (
                            <div key={e.id} className="log-entry" style={{ color: PARTITION_COLORS[e.partition] }}>{e.msg}</div>
                        ))}
                    </div>
                </div>
                <div className="info-panel">
                    <h3>// how it works</h3>
                    <ul>
                        <li>Messages are append-only (immutable log)</li>
                        <li>Partition key determines which partition</li>
                        <li>Same key → same partition → strict ordering</li>
                        <li>Different partitions processed in parallel</li>
                    </ul>
                    <h3 style={{ marginTop: 12 }}>// trade-offs</h3>
                    <ul>
                        <li>Scalable — add partitions for more throughput</li>
                        <li>Replay-able — consumers can seek to any offset</li>
                        <li className="con">No global ordering across partitions</li>
                        <li className="con">Hot keys create partition hotspots</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
