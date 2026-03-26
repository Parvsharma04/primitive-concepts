import Link from 'next/link';

const patterns = [
    { name: 'Circuit Breaker', href: '/resilience/circuit-breaker', desc: 'Prevent cascading failures by switching between CLOSED, OPEN, and HALF_OPEN states based on failure thresholds.' },
    { name: 'Retry w/ Exponential Backoff', href: '/resilience/retry', desc: 'Retry failed requests with progressively longer waits. Add jitter to avoid thundering herd.' },
];

export default function ResiliencePage() {
    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">resilience</span>
                <h1>Resilience Patterns</h1>
                <p className="subtitle">
                    Patterns that help distributed services degrade gracefully under failure, preventing cascading outages.
                </p>
            </div>

            <div className="info-panel" style={{ marginBottom: 24 }}>
                <h3>// concept</h3>
                <p>
                    In distributed systems, failures are inevitable. Resilience patterns protect your system
                    by detecting failures early, isolating them, and recovering automatically — rather than
                    letting a single failing component take down the entire service.
                </p>
            </div>

            <div className="cards-grid">
                {patterns.map(p => (
                    <Link key={p.href} href={p.href} className="concept-card">
                        <h3>{p.name}</h3>
                        <p>{p.desc}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
