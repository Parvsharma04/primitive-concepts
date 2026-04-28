import Link from 'next/link';

const algorithms = [
    { name: 'Two Phase Commit', href: '/consensus/two-phase-commit', desc: 'Coordinator asks all participants to prepare, then commit. Atomic but blocking if coordinator fails.' },
    { name: 'Three Phase Commit', href: '/consensus/three-phase-commit', desc: 'Adds a pre-commit phase to reduce blocking. Participants can safely abort if coordinator is unreachable.' },
    { name: 'Simplified Raft', href: '/consensus/simplified-raft', desc: 'Leader-based consensus: elect a leader, replicate logs, commit when majority acknowledges.' },
];

export default function ConsensusPage() {
    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">consensus</span>
                <h1>Consensus Algorithms</h1>
                <p className="subtitle">Protocols for achieving agreement among distributed nodes, even in the presence of failures.</p>
            </div>
            <div className="info-panel" style={{ marginBottom: 24 }}>
                <h3>// concept</h3>
                <p>Consensus ensures all nodes agree on a single value or decision. The challenge: achieving agreement despite network partitions, crashes, and message delays.</p>
            </div>
            <div className="cards-grid">
                {algorithms.map(a => (<Link key={a.href} href={a.href} className="concept-card"><h3>{a.name}</h3><p>{a.desc}</p></Link>))}
            </div>
        </div>
    );
}
