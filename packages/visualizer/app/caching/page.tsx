import Link from 'next/link';

const patterns = [
    { name: 'LRU Cache', href: '/caching/lru-cache', desc: 'Evict the least recently used item when capacity is reached. O(1) get/put with a hash map + doubly linked list.' },
    { name: 'LFU Cache', href: '/caching/lfu-cache', desc: 'Evict the least frequently used item. Tracks access counts to keep the hottest data in memory.' },
    { name: 'TTL Cache', href: '/caching/ttl-cache', desc: 'Entries expire after a time-to-live. Ensures stale data is automatically purged without manual invalidation.' },
    { name: 'Cache Aside', href: '/caching/cache-aside', desc: 'Application checks cache first, loads from DB on miss, then populates cache. Most common caching strategy.' },
    { name: 'Write-Through/Back', href: '/caching/write-through-back', desc: 'Write-through writes to cache and DB synchronously. Write-back buffers writes for eventual persistence.' },
    { name: 'Cache Stampede', href: '/caching/cache-stampede', desc: 'Prevent thundering herd when a popular key expires. Use locking or probabilistic early expiration.' },
    { name: 'Bloom Filter', href: '/caching/bloom-filter', desc: 'Space-efficient probabilistic structure to test set membership. May have false positives but never false negatives.' },
];

export default function CachingPage() {
    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">caching</span>
                <h1>Caching Patterns</h1>
                <p className="subtitle">
                    Strategies for storing frequently accessed data closer to the consumer, reducing latency and backend load.
                </p>
            </div>

            <div className="info-panel" style={{ marginBottom: 24 }}>
                <h3>// concept</h3>
                <p>
                    Caching stores copies of data in fast-access storage layers. The challenge lies in
                    choosing what to cache, when to evict, and how to keep cached data consistent with the source of truth.
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
