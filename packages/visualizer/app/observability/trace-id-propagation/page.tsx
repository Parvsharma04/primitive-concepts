'use client';

import { useState, useCallback } from 'react';

interface Span { service: string; operation: string; duration: number; traceId: string; spanId: string; parentSpanId: string | null; }

const SERVICES = ['gateway', 'auth-service', 'order-service', 'payment-service', 'notification-service'];

export default function TraceIDPropagationPage() {
    const [traces, setTraces] = useState<Span[][]>([]);

    const simulateRequest = useCallback(() => {
        const traceId = `trace-${Math.random().toString(36).slice(2, 10)}`;
        const spans: Span[] = [];
        let parentId: string | null = null;

        const chain = SERVICES.slice(0, 2 + Math.floor(Math.random() * 3));
        chain.forEach((svc, i) => {
            const spanId = `span-${Math.random().toString(36).slice(2, 8)}`;
            spans.push({
                service: svc,
                operation: i === 0 ? 'handle_request' : `call_${svc}`,
                duration: 10 + Math.floor(Math.random() * 200),
                traceId,
                spanId,
                parentSpanId: parentId,
            });
            parentId = spanId;
        });

        setTraces(prev => [...prev.slice(-5), spans]);
    }, []);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">observability</span>
                <h1>Trace ID Propagation</h1>
                <p className="subtitle">A single trace ID flows through all services handling a request — enabling correlation.</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button onClick={simulateRequest} className="sim-button">Simulate Request</button>
            </div>

            {traces.map((spans, ti) => (
                <div key={ti} className="info-panel" style={{ marginBottom: 12, padding: 8 }}>
                    <div style={{ fontSize: 10, color: 'var(--info)', marginBottom: 4 }}>trace: {spans[0]?.traceId}</div>
                    {spans.map((span, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', marginLeft: i * 16 }}>
                            <div style={{ width: `${Math.min(span.duration / 5, 100)}px`, height: 8, background: 'var(--accent)', borderRadius: 2, opacity: 0.8 }} />
                            <span style={{ fontSize: 10, color: 'var(--text-bright)' }}>{span.service}</span>
                            <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>{span.operation} ({span.duration}ms)</span>
                        </div>
                    ))}
                </div>
            ))}

            {traces.length === 0 && <p style={{ color: 'var(--text-dim)', fontSize: 12 }}>Click &quot;Simulate Request&quot; to generate traces.</p>}
        </div>
    );
}
