import Link from 'next/link';

const patterns = [
    { name: 'Primary-Replica', href: '/consistency/primary-replica', desc: 'One primary handles writes and replicates to read replicas. Scales reads but introduces replication lag.' },
    { name: 'Read/Write Quorum', href: '/consistency/read-write-quorum', desc: 'Require W writes and R reads where W+R > N for strong consistency. Tunable consistency-availability trade-off.' },
    { name: 'Vector Clocks', href: '/consistency/vector-clocks', desc: 'Track causal ordering of events across nodes. Detect concurrent updates and resolve conflicts.' },
    { name: 'CRDT Counters', href: '/consistency/crdt-counters', desc: 'Conflict-free replicated data types that converge without coordination. Increment/decrement across replicas.' },
];

export default function ConsistencyPage() {
    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">consistency</span>
                <h1>Consistency Patterns</h1>
                <p className="subtitle">Models for keeping data consistent across distributed replicas with different trade-offs.</p>
            </div>
            <div className="info-panel" style={{ marginBottom: 24 }}>
                <h3>// concept</h3>
                <p>The CAP theorem states you can only have two of: Consistency, Availability, Partition Tolerance. These patterns explore different consistency models and their trade-offs.</p>
            </div>
            <div className="cards-grid">
                {patterns.map(p => (<Link key={p.href} href={p.href} className="concept-card"><h3>{p.name}</h3><p>{p.desc}</p></Link>))}
            </div>
        </div>
    );
}
