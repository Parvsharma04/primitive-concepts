import Link from 'next/link';

const algorithms = [
    { name: 'Round Robin', href: '/load-balancing/round-robin', desc: 'Distribute requests sequentially across servers in a circular order. Simple and fair for uniform workloads.' },
    { name: 'Weighted Round Robin', href: '/load-balancing/weighted-round-robin', desc: 'Assign weights to servers based on capacity. Higher-weight servers receive proportionally more traffic.' },
    { name: 'Least Connections', href: '/load-balancing/least-connections', desc: 'Route to the server with the fewest active connections. Adapts to varying request durations.' },
    { name: 'IP Hashing', href: '/load-balancing/ip-hashing', desc: 'Hash client IP to deterministically select a server. Ensures session affinity without shared state.' },
    { name: 'Consistent Hashing', href: '/load-balancing/consistent-hashing', desc: 'Map keys to a ring of nodes. Adding/removing nodes only redistributes a fraction of keys.' },
];

export default function LoadBalancingPage() {
    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">load balancing</span>
                <h1>Load Balancing Algorithms</h1>
                <p className="subtitle">Distribute incoming traffic across multiple servers to maximize throughput and minimize response time.</p>
            </div>

            <div className="info-panel" style={{ marginBottom: 24 }}>
                <h3>// concept</h3>
                <p>Load balancers act as reverse proxies, distributing client requests across backend servers. The algorithm determines which server handles each request.</p>
            </div>

            <div className="cards-grid">
                {algorithms.map(a => (
                    <Link key={a.href} href={a.href} className="concept-card">
                        <h3>{a.name}</h3>
                        <p>{a.desc}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
