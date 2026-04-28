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
      { name: 'Hedged Requests', href: '/resilience/hedged-requests', desc: 'Fire duplicate requests after a delay and use whichever responds first — tame tail latency by racing redundant calls.' },
      { name: 'Fallback Strategy', href: '/resilience/fallback-strategy', desc: 'Chain alternative providers to gracefully degrade — try primary, then secondary, cache, and finally a static default.' },
    ],
  },
  {
    category: 'Caching',
    items: [
      { name: 'LRU Cache', href: '/caching/lru-cache', desc: 'Evict the least recently used item when capacity is reached. O(1) get/put with a hash map + doubly linked list.' },
      { name: 'LFU Cache', href: '/caching/lfu-cache', desc: 'Evict the least frequently used item. Tracks access counts to keep the hottest data in memory.' },
      { name: 'TTL Cache', href: '/caching/ttl-cache', desc: 'Entries expire after a time-to-live. Ensures stale data is automatically purged without manual invalidation.' },
      { name: 'Cache Aside', href: '/caching/cache-aside', desc: 'Application checks cache first, loads from DB on miss, then populates cache. Most common caching strategy.' },
      { name: 'Write-Through/Back', href: '/caching/write-through-back', desc: 'Write-through writes to cache and DB synchronously. Write-back buffers writes for eventual persistence.' },
      { name: 'Cache Stampede', href: '/caching/cache-stampede', desc: 'Prevent thundering herd when a popular key expires. Use locking or probabilistic early expiration.' },
      { name: 'Bloom Filter', href: '/caching/bloom-filter', desc: 'Space-efficient probabilistic structure to test set membership. May have false positives but never false negatives.' },
    ],
  },
  {
    category: 'Load Balancing',
    items: [
      { name: 'Round Robin', href: '/load-balancing/round-robin', desc: 'Distribute requests sequentially across servers in a circular order. Simple and fair for uniform workloads.' },
      { name: 'Weighted Round Robin', href: '/load-balancing/weighted-round-robin', desc: 'Assign weights to servers based on capacity. Higher-weight servers receive proportionally more traffic.' },
      { name: 'Least Connections', href: '/load-balancing/least-connections', desc: 'Route to the server with the fewest active connections. Adapts to varying request durations.' },
      { name: 'IP Hashing', href: '/load-balancing/ip-hashing', desc: 'Hash client IP to deterministically select a server. Ensures session affinity without shared state.' },
      { name: 'Consistent Hashing', href: '/load-balancing/consistent-hashing', desc: 'Map keys to a ring of nodes. Adding/removing nodes only redistributes a fraction of keys.' },
    ],
  },
  {
    category: 'Messaging',
    items: [
      { name: 'In-Memory Queue', href: '/messaging/in-memory-queue', desc: 'FIFO queue for decoupling producers and consumers. Simple async communication within a single process.' },
      { name: 'Pub/Sub Broker', href: '/messaging/pub-sub-broker', desc: 'Publishers emit events to topics, subscribers receive matching messages. Decouples producers from consumers.' },
      { name: 'At-Most-Once', href: '/messaging/at-most-once', desc: 'Fire and forget delivery. Messages may be lost but are never duplicated. Lowest latency guarantee.' },
      { name: 'At-Least-Once', href: '/messaging/at-least-once', desc: 'Retry until acknowledged. Messages are never lost but may be delivered multiple times.' },
      { name: 'Dead Letter Queue', href: '/messaging/dead-letter-queue', desc: 'Route failed messages to a separate queue for inspection. Prevents poison messages from blocking processing.' },
      { name: 'Consumer Groups', href: '/messaging/consumer-groups', desc: 'Distribute partitions across consumers in a group. Enables parallel processing with load balancing.' },
      { name: 'Partitioned Log', href: '/messaging/partitioned-log', desc: 'Kafka-style append-only log split into partitions. Ordered within partition, parallel across partitions.' },
    ],
  },
  {
    category: 'Coordination',
    items: [
      { name: 'Distributed Lock', href: '/coordination/distributed-lock', desc: 'Ensure mutual exclusion across distributed nodes. Only one process can hold the lock at a time.' },
      { name: 'Leader Election', href: '/coordination/leader-election', desc: 'Elect a single leader among distributed nodes to coordinate work. Handles failover automatically.' },
      { name: 'Heartbeat Monitor', href: '/coordination/heartbeat-monitor', desc: 'Periodic health signals detect node failures. Missing heartbeats trigger failover or deregistration.' },
      { name: 'Service Registry', href: '/coordination/service-registry', desc: 'Central catalog where services register their endpoints. Enables dynamic discovery of available instances.' },
      { name: 'Service Discovery', href: '/coordination/service-discovery', desc: 'Clients query the registry to find healthy service instances. Supports client-side or server-side patterns.' },
    ],
  },
  {
    category: 'Consistency',
    items: [
      { name: 'Primary-Replica', href: '/consistency/primary-replica', desc: 'One primary handles writes and replicates to read replicas. Scales reads but introduces replication lag.' },
      { name: 'Read/Write Quorum', href: '/consistency/read-write-quorum', desc: 'Require W writes and R reads where W+R > N for strong consistency. Tunable consistency-availability trade-off.' },
      { name: 'Vector Clocks', href: '/consistency/vector-clocks', desc: 'Track causal ordering of events across nodes. Detect concurrent updates and resolve conflicts.' },
      { name: 'CRDT Counters', href: '/consistency/crdt-counters', desc: 'Conflict-free replicated data types that converge without coordination. Increment/decrement across replicas.' },
    ],
  },
  {
    category: 'Consensus',
    items: [
      { name: 'Two Phase Commit', href: '/consensus/two-phase-commit', desc: 'Coordinator asks all participants to prepare, then commit. Atomic but blocking if coordinator fails.' },
      { name: 'Three Phase Commit', href: '/consensus/three-phase-commit', desc: 'Adds a pre-commit phase to reduce blocking. Participants can safely abort if coordinator is unreachable.' },
      { name: 'Simplified Raft', href: '/consensus/simplified-raft', desc: 'Leader-based consensus: elect a leader, replicate logs, commit when majority acknowledges. Understandable by design.' },
    ],
  },
  {
    category: 'Storage',
    items: [
      { name: 'Key-Value Store', href: '/storage/key-value-store', desc: 'Simple get/put/delete interface backed by a hash map. Foundation of most distributed storage systems.' },
      { name: 'Append-Only Log', href: '/storage/append-only-log', desc: 'Immutable sequential writes. Fast writes, natural audit trail, basis for event sourcing and WAL.' },
      { name: 'Write Ahead Log', href: '/storage/write-ahead-log', desc: 'Log mutations before applying them. Enables crash recovery by replaying the log after restart.' },
      { name: 'SSTable', href: '/storage/sstable', desc: 'Sorted String Table: immutable, sorted key-value file with an index for fast lookups.' },
      { name: 'LSM Tree', href: '/storage/lsm-tree', desc: 'Log-Structured Merge Tree: buffer writes in memory, flush to sorted files, merge in background.' },
    ],
  },
  {
    category: 'Observability',
    items: [
      { name: 'Metrics Collector', href: '/observability/metrics-collector', desc: 'Collect counters, gauges, and rates from your services. Aggregate and expose for monitoring dashboards.' },
      { name: 'Histogram', href: '/observability/histogram', desc: 'Track value distributions with configurable buckets. Compute percentiles (p50, p95, p99) from observations.' },
      { name: 'Structured Logger', href: '/observability/structured-logger', desc: 'Emit JSON log lines with consistent fields. Enables machine-parseable, searchable, and filterable logs.' },
      { name: 'Trace ID Propagation', href: '/observability/trace-id-propagation', desc: 'Propagate a unique trace ID across service boundaries. Correlate logs and spans for distributed tracing.' },
    ],
  },
  {
    category: 'Security',
    items: [
      { name: 'JWT Validation', href: '/security/jwt-validation', desc: 'Decode and verify JSON Web Tokens. Validate signature, expiry, issuer, and claims without shared state.' },
      { name: 'API Key Validation', href: '/security/api-key-validation', desc: 'Authenticate requests via API keys. Simple, stateless auth for service-to-service communication.' },
      { name: 'Idempotency Key', href: '/security/idempotency-key', desc: 'Deduplicate requests using a unique key. Safely retry operations without causing duplicate side effects.' },
      { name: 'HMAC Verification', href: '/security/hmac-verification', desc: 'Verify message integrity and authenticity using a shared secret. Detect tampering in webhooks and APIs.' },
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
