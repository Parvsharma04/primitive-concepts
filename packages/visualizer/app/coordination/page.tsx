import Link from 'next/link';

const patterns = [
    { name: 'Distributed Lock', href: '/coordination/distributed-lock', desc: 'Ensure mutual exclusion across distributed nodes. Only one process can hold the lock at a time.' },
    { name: 'Leader Election', href: '/coordination/leader-election', desc: 'Elect a single leader among distributed nodes to coordinate work. Handles failover automatically.' },
    { name: 'Heartbeat Monitor', href: '/coordination/heartbeat-monitor', desc: 'Periodic health signals detect node failures. Missing heartbeats trigger failover or deregistration.' },
    { name: 'Service Registry', href: '/coordination/service-registry', desc: 'Central catalog where services register their endpoints. Enables dynamic discovery of available instances.' },
    { name: 'Service Discovery', href: '/coordination/service-discovery', desc: 'Clients query the registry to find healthy service instances. Supports client-side or server-side patterns.' },
];

export default function CoordinationPage() {
    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">coordination</span>
                <h1>Coordination Patterns</h1>
                <p className="subtitle">Primitives for managing distributed node lifecycles, leadership, and mutual exclusion.</p>
            </div>
            <div className="info-panel" style={{ marginBottom: 24 }}>
                <h3>// concept</h3>
                <p>Coordination ensures distributed nodes work together: electing leaders, acquiring locks, detecting failures, and discovering services dynamically.</p>
            </div>
            <div className="cards-grid">
                {patterns.map(p => (<Link key={p.href} href={p.href} className="concept-card"><h3>{p.name}</h3><p>{p.desc}</p></Link>))}
            </div>
        </div>
    );
}
