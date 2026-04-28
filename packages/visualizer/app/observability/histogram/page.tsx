'use client';

import { useState, useCallback } from 'react';

const BUCKETS = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000];

export default function HistogramPage() {
    const [observations, setObservations] = useState<number[]>([]);
    const [bucketCounts, setBucketCounts] = useState(new Array(BUCKETS.length + 1).fill(0));

    const observe = useCallback((value?: number) => {
        const v = value ?? Math.floor(Math.random() * 1000 * Math.random());
        setObservations(prev => [...prev, v]);
        setBucketCounts(prev => {
            const next = [...prev];
            const idx = BUCKETS.findIndex(b => v <= b);
            next[idx === -1 ? BUCKETS.length : idx]++;
            return next;
        });
    }, []);

    const simulateBurst = useCallback(() => {
        for (let i = 0; i < 20; i++) setTimeout(() => observe(), i * 50);
    }, [observe]);

    const sorted = [...observations].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)] ?? 0;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
    const p99 = sorted[Math.floor(sorted.length * 0.99)] ?? 0;
    const maxCount = Math.max(...bucketCounts, 1);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">observability</span>
                <h1>Histogram</h1>
                <p className="subtitle">Track latency distributions and compute percentiles from bucket counts.</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button onClick={() => observe()} className="sim-button">Observe Random</button>
                <button onClick={simulateBurst} className="sim-button">Burst ×20</button>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 12 }}>
                <span>Count: {observations.length}</span>
                <span style={{ color: 'var(--accent)' }}>p50: {p50}ms</span>
                <span style={{ color: 'var(--info)' }}>p95: {p95}ms</span>
                <span style={{ color: 'var(--warning)' }}>p99: {p99}ms</span>
            </div>

            {/* Bar chart */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120, marginBottom: 16 }}>
                {bucketCounts.map((count, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: '100%', background: 'var(--accent)', borderRadius: '2px 2px 0 0', height: `${(count / maxCount) * 100}%`, minHeight: count > 0 ? 2 : 0, transition: 'height 0.2s' }} />
                        <div style={{ fontSize: 8, color: 'var(--text-dim)', marginTop: 2, textAlign: 'center' }}>
                            {i < BUCKETS.length ? `≤${BUCKETS[i]}` : `>${BUCKETS[BUCKETS.length - 1]}`}
                        </div>
                    </div>
                ))}
            </div>

            <div className="info-panel">
                <h3>// raw observations (last 20)</h3>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{observations.slice(-20).join(', ')} ms</div>
            </div>
        </div>
    );
}
