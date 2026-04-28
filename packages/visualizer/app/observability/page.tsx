import Link from 'next/link';

const tools = [
    { name: 'Metrics Collector', href: '/observability/metrics-collector', desc: 'Collect counters, gauges, and rates from your services. Aggregate and expose for monitoring dashboards.' },
    { name: 'Histogram', href: '/observability/histogram', desc: 'Track value distributions with configurable buckets. Compute percentiles (p50, p95, p99) from observations.' },
    { name: 'Structured Logger', href: '/observability/structured-logger', desc: 'Emit JSON log lines with consistent fields. Enables machine-parseable, searchable, and filterable logs.' },
    { name: 'Trace ID Propagation', href: '/observability/trace-id-propagation', desc: 'Propagate a unique trace ID across service boundaries. Correlate logs and spans for distributed tracing.' },
];

export default function ObservabilityPage() {
    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">observability</span>
                <h1>Observability Tools</h1>
                <p className="subtitle">Instruments for understanding what your distributed system is doing at runtime.</p>
            </div>
            <div className="info-panel" style={{ marginBottom: 24 }}>
                <h3>// concept</h3>
                <p>Observability = Metrics + Logs + Traces. Together they provide visibility into system behavior, enabling debugging, alerting, and capacity planning.</p>
            </div>
            <div className="cards-grid">
                {tools.map(t => (<Link key={t.href} href={t.href} className="concept-card"><h3>{t.name}</h3><p>{t.desc}</p></Link>))}
            </div>
        </div>
    );
}
