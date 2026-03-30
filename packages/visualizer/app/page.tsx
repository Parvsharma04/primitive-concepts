import Link from 'next/link';

const concepts = [
  {
    category: 'Rate Limiting',
    items: [
      { name: 'Fixed Window Counter', href: '/rate-limiting/fixed-window-counter', desc: 'Divide time into fixed windows with a counter per window. Simple but has the boundary burst problem.' },
      { name: 'Sliding Window Log', href: '/rate-limiting/sliding-window-log', desc: 'Store every request timestamp and filter old ones. 100% accurate but memory intensive.' },
      { name: 'Sliding Window Counter', href: '/rate-limiting/sliding-window-counter', desc: 'Hybrid approach: uses weighted counters from current + previous windows. Best of both worlds.' },
      { name: 'Token Bucket', href: '/rate-limiting/token-bucket', desc: 'Tokens refill at a fixed rate. Each request consumes one. Allows controlled bursting up to bucket capacity.' },
      { name: 'Leaky Bucket', href: '/rate-limiting/leaky-bucket', desc: 'Requests fill a bucket that drains at a constant rate. Smooths bursty traffic into a steady flow.' },
    ],
  },
  {
    category: 'Resilience',
    items: [
      { name: 'Circuit Breaker', href: '/resilience/circuit-breaker', desc: 'Prevent cascading failures by switching between CLOSED, OPEN, and HALF_OPEN states based on failure thresholds.' },
      { name: 'Retry with Backoff', href: '/resilience/retry-with-backoff', desc: 'Automatically retry failed operations with exponentially increasing delays and optional jitter to avoid thundering herds.' },
      { name: 'Timeout Wrapper', href: '/resilience/timeout-wrapper', desc: 'Wrap operations with a timeout to prevent them from hanging indefinitely. Races the operation against a timer.' },
      { name: 'Bulkhead', href: '/resilience/bulkhead', desc: 'Isolate concurrent workloads with execution slots and a bounded queue — prevent one overwhelmed resource from starving others.' },
    ],
  },
];

export default function Home() {
  return (
    <div className="animate-in">
      <div className="page-header">
        <span className="category-tag">overview</span>
        <h1>sys-d Visualizer</h1>
        <p className="subtitle">
          Interactive visualizations of distributed systems primitives — built from scratch in TypeScript.
        </p>
      </div>

      {concepts.map(section => (
        <div key={section.category} style={{ marginBottom: 32 }}>
          <h2 style={{ marginBottom: 4 }}>{section.category}</h2>
          <div style={{
            height: 1,
            background: 'var(--border)',
            marginBottom: 16,
          }} />
          <div className="cards-grid">
            {section.items.map(item => (
              <Link key={item.href} href={item.href} className="concept-card">
                <h3>{item.name}</h3>
                <p>{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
