'use client';

import { useState, useCallback } from 'react';

interface Span {
  service: string;
  operation: string;
  duration: number;
  traceId: string;
  spanId: string;
  parentSpanId: string | null;
  startOffset: number;
}

const SERVICES = ['gateway', 'auth-service', 'order-service', 'payment-service', 'notification-service'];

export default function TraceIDPropagationPage() {
  const [traces, setTraces] = useState<Span[][]>([]);

  const simulateRequest = useCallback(() => {
    const traceId = `trace-${Math.random().toString(36).slice(2, 10)}`;
    const spans: Span[] = [];
    let parentId: string | null = null;
    let offset = 0;

    const chainLength = 2 + Math.floor(Math.random() * 3);
    const chain = SERVICES.slice(0, chainLength);

    chain.forEach((svc, i) => {
      const spanId = `span-${Math.random().toString(36).slice(2, 8)}`;
      const duration = 10 + Math.floor(Math.random() * 200);
      spans.push({
        service: svc,
        operation: i === 0 ? 'handle_request' : `call_${svc.replace('-service', '')}`,
        duration,
        traceId,
        spanId,
        parentSpanId: parentId,
        startOffset: offset,
      });
      parentId = spanId;
      offset += Math.floor(duration * 0.3); // Child starts before parent finishes
    });

    setTraces(prev => [...prev.slice(-4), spans]);
  }, []);

  const totalTraces = traces.length;
  const avgSpans = totalTraces > 0
    ? Math.round(traces.reduce((s, t) => s + t.length, 0) / totalTraces)
    : 0;

  return (
    <div className="animate-in">
      <div className="page-header">
        <span className="category-tag">observability</span>
        <h1>Trace ID Propagation</h1>
        <p className="subtitle">
          A single trace ID flows through all services handling a request — enabling end-to-end correlation.
        </p>
      </div>

      <div className="stats-row" style={{ marginBottom: 16 }}>
        <div className="stat">
          <span className="stat-label">traces</span>
          <span className="stat-value">{totalTraces}</span>
        </div>
        <div className="stat">
          <span className="stat-label">avg spans/trace</span>
          <span className="stat-value">{avgSpans}</span>
        </div>
      </div>

      <div className="viz-controls" style={{ marginBottom: 16 }}>
        <button onClick={simulateRequest} className="btn btn-accent">
          Simulate Request
        </button>
        <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 8 }}>
          Generates a distributed trace across services
        </span>
      </div>

      <div className="viz-container" style={{ marginBottom: 16 }}>
        {traces.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)', fontSize: 12, fontStyle: 'italic' }}>
            Click &quot;Simulate Request&quot; to generate traces
          </div>
        ) : (
          traces.map((spans, ti) => {
            const totalDuration = Math.max(...spans.map(s => s.startOffset + s.duration));

            return (
              <div key={ti} style={{
                marginBottom: 16,
                padding: 12,
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)'
              }}>
                <div style={{
                  fontSize: 10,
                  color: 'var(--info)',
                  marginBottom: 8,
                  fontFamily: 'var(--font-mono)'
                }}>
                  🔗 {spans[0]?.traceId} ({spans.length} spans, {totalDuration}ms total)
                </div>

                {spans.map((span, i) => {
                  const widthPct = (span.duration / totalDuration) * 100;
                  const leftPct = (span.startOffset / totalDuration) * 100;
                  const colors = ['var(--accent)', 'var(--info)', 'var(--warning)', '#c084fc', '#fb923c'];

                  return (
                    <div key={i} style={{
                      display: 'grid',
                      gridTemplateColumns: '120px 1fr 60px',
                      alignItems: 'center',
                      gap: 8,
                      padding: '4px 0'
                    }}>
                      <div style={{
                        fontSize: 10,
                        color: colors[i % colors.length],
                        fontFamily: 'var(--font-mono)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {span.service}
                      </div>
                      <div style={{ position: 'relative', height: 14, background: 'var(--surface)' }}>
                        <div style={{
                          position: 'absolute',
                          left: `${leftPct}%`,
                          width: `${Math.max(widthPct, 2)}%`,
                          height: '100%',
                          background: colors[i % colors.length],
                          borderRadius: 2,
                          opacity: 0.8
                        }} />
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--text-dim)', textAlign: 'right' }}>
                        {span.duration}ms
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      <div className="info-columns">
        <div className="info-panel">
          <h3>How It Works</h3>
          <ul style={{ fontSize: 12, lineHeight: 1.6 }}>
            <li>First service generates unique trace ID</li>
            <li>Trace ID propagated via headers (traceparent)</li>
            <li>Each service creates a span with parent reference</li>
            <li>Spans collected centrally for visualization</li>
          </ul>
        </div>
        <div className="info-panel">
          <h3>Use Cases</h3>
          <ul style={{ fontSize: 12, lineHeight: 1.6 }}>
            <li>Jaeger, Zipkin, OpenTelemetry</li>
            <li>Debugging latency across services</li>
            <li>Finding bottlenecks in request flow</li>
            <li>Service dependency mapping</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
