import Link from 'next/link';

const algorithms = [
    { name: 'Fixed Window Counter', href: '/rate-limiting/fixed-window-counter', desc: 'Divide time into fixed windows with a counter per window. Simple but has the boundary burst problem.', complexity: 'O(1)' },
    { name: 'Sliding Window Log', href: '/rate-limiting/sliding-window-log', desc: 'Store every request timestamp and filter stale entries. 100% accurate but memory intensive.', complexity: 'O(n)' },
    { name: 'Sliding Window Counter', href: '/rate-limiting/sliding-window-counter', desc: 'Hybrid: weighted counters from current + previous windows. Memory efficient and fairly accurate.', complexity: 'O(1)' },
    { name: 'Token Bucket', href: '/rate-limiting/token-bucket', desc: 'Tokens refill at a fixed rate. Each request consumes a token. Allows controlled bursting.', complexity: 'O(1)' },
    { name: 'Leaky Bucket', href: '/rate-limiting/leaky-bucket', desc: 'Bucket fills with requests and drains at a constant rate. Smooths bursty traffic.', complexity: 'O(1)' },
];

export default function RateLimitingPage() {
    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">rate limiting</span>
                <h1>Rate Limiting Algorithms</h1>
                <p className="subtitle">
                    Control how many requests a client can make within a time window. Each algorithm makes different trade-offs between accuracy, memory, and burst handling.
                </p>
            </div>

            <div className="info-panel" style={{ marginBottom: 24 }}>
                <h3>// concept</h3>
                <p>
                    Rate limiting protects your services from being overwhelmed by too many requests.
                    It enforces a maximum number of operations within a given time window.
                    The challenge is choosing the right algorithm — each has different trade-offs
                    in accuracy, memory usage, and how it handles request bursts.
                </p>
            </div>

            <div className="cards-grid">
                {algorithms.map(alg => (
                    <Link key={alg.href} href={alg.href} className="concept-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <h3>{alg.name}</h3>
                            <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{alg.complexity}</span>
                        </div>
                        <p>{alg.desc}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
