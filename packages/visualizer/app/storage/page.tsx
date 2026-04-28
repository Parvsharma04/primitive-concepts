import Link from 'next/link';

const engines = [
    { name: 'Key-Value Store', href: '/storage/key-value-store', desc: 'Simple get/put/delete interface backed by a hash map. Foundation of most distributed storage systems.' },
    { name: 'Append-Only Log', href: '/storage/append-only-log', desc: 'Immutable sequential writes. Fast writes, natural audit trail, basis for event sourcing and WAL.' },
    { name: 'Write Ahead Log', href: '/storage/write-ahead-log', desc: 'Log mutations before applying them. Enables crash recovery by replaying the log after restart.' },
    { name: 'SSTable', href: '/storage/sstable', desc: 'Sorted String Table: immutable, sorted key-value file with an index for fast lookups.' },
    { name: 'LSM Tree', href: '/storage/lsm-tree', desc: 'Log-Structured Merge Tree: buffer writes in memory, flush to sorted files, merge in background.' },
];

export default function StoragePage() {
    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">storage</span>
                <h1>Storage Engines</h1>
                <p className="subtitle">Data structures and algorithms that power database storage layers.</p>
            </div>
            <div className="info-panel" style={{ marginBottom: 24 }}>
                <h3>// concept</h3>
                <p>Storage engines determine how data is written, indexed, and retrieved from disk. The trade-off is typically between write throughput and read latency.</p>
            </div>
            <div className="cards-grid">
                {engines.map(e => (<Link key={e.href} href={e.href} className="concept-card"><h3>{e.name}</h3><p>{e.desc}</p></Link>))}
            </div>
        </div>
    );
}
