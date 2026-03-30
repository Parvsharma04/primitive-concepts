import Link from 'next/link';

const patterns = [
    { name: 'Circuit Breaker', href: '/resilience/circuit-breaker', desc: 'Prevent cascading failures by switching between CLOSED, OPEN, and HALF_OPEN states based on failure thresholds.' },
    { name: 'Retry with Backoff', href: '/resilience/retry-with-backoff', desc: 'Automatically retry failed operations with exponentially increasing delays and optional jitter to avoid thundering herds.' },
    { name: 'Timeout Wrapper', href: '/resilience/timeout-wrapper', desc: 'Race an async operation against a deadline — if it takes too long, abort and fail fast instead of waiting forever.' },
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
