import Link from 'next/link';

const patterns = [
    { name: 'In-Memory Queue', href: '/messaging/in-memory-queue', desc: 'FIFO queue for decoupling producers and consumers. Simple async communication within a single process.' },
    { name: 'Pub/Sub Broker', href: '/messaging/pub-sub-broker', desc: 'Publishers emit events to topics, subscribers receive matching messages. Decouples producers from consumers.' },
    { name: 'At-Most-Once', href: '/messaging/at-most-once', desc: 'Fire and forget delivery. Messages may be lost but are never duplicated. Lowest latency guarantee.' },
    { name: 'At-Least-Once', href: '/messaging/at-least-once', desc: 'Retry until acknowledged. Messages are never lost but may be delivered multiple times.' },
    { name: 'Dead Letter Queue', href: '/messaging/dead-letter-queue', desc: 'Route failed messages to a separate queue for inspection. Prevents poison messages from blocking processing.' },
    { name: 'Consumer Groups', href: '/messaging/consumer-groups', desc: 'Distribute partitions across consumers in a group. Enables parallel processing with load balancing.' },
    { name: 'Partitioned Log', href: '/messaging/partitioned-log', desc: 'Kafka-style append-only log split into partitions. Ordered within partition, parallel across partitions.' },
];

export default function MessagingPage() {
    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">messaging</span>
                <h1>Messaging Patterns</h1>
                <p className="subtitle">Asynchronous communication primitives for decoupling services and ensuring reliable message delivery.</p>
            </div>
            <div className="info-panel" style={{ marginBottom: 24 }}>
                <h3>// concept</h3>
                <p>Messaging enables services to communicate without tight coupling. Producers emit messages; consumers process them. The challenge: choosing the right delivery guarantees, ordering, and failure handling.</p>
            </div>
            <div className="cards-grid">
                {patterns.map(p => (<Link key={p.href} href={p.href} className="concept-card"><h3>{p.name}</h3><p>{p.desc}</p></Link>))}
            </div>
        </div>
    );
}
