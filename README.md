# System Design Primitives

A production-grade implementation of distributed systems building blocks
in **TypeScript**.

------------------------------------------------------------------------

## 🧠 Purpose

This repository is a hands-on distributed systems lab built entirely in
TypeScript.

It implements real-world primitives used in scalable systems such as:

-   Rate Limiters
-   Circuit Breakers
-   Distributed Locks
-   Load Balancers
-   Message Queues
-   Consensus Algorithms
-   Caching Systems
-   Replication & Quorum
-   Consistent Hashing
-   Storage Engines
-   Observability Tools

The goal:

> Learn distributed systems by building them from scratch.

------------------------------------------------------------------------

## 🏗 Repository Structure

ts-system-design-primitives/ 
│ 
├── packages/ 
│ 
├── rate-limiting/ 
│ 
├──
caching/ 
│ 
├── resilience/ 
│ 
├── load-balancing/ 
│ 
├── messaging/ 
│ 
├──coordination/ 
│ 
├── consistency/ 
│ 
├── consensus/ 
│ 
├── storage/ 
│ 
├──networking/ 
│ 
├── observability/ 
│ 
├── security/ 
│ 
└── simulations/ 
│
├── benchmarks/ 
│
├── examples/ 
│
├── docs/ 
│
└── shared/

------------------------------------------------------------------------

## 📦 Implemented Primitives

### Rate Limiting

-   Fixed Window Counter
-   Sliding Window Log
-   Sliding Window Counter
-   Token Bucket
-   Leaky Bucket
-   Distributed Rate Limiter (Redis-backed)

### Resilience

-   Circuit Breaker (Closed / Open / Half-Open)
-   Retry with Exponential Backoff
-   Timeout Wrapper
-   Bulkhead Pattern
-   Hedged Requests
-   Fallback Strategy

### Caching

-   LRU Cache
-   LFU Cache
-   TTL Cache
-   Cache Aside
-   Write-through / Write-back
-   Cache Stampede Protection
-   Bloom Filter

### Load Balancing

-   Round Robin
-   Weighted Round Robin
-   Least Connections
-   IP Hashing
-   Consistent Hashing

### Messaging

-   In-memory Queue
-   Pub/Sub Broker
-   At-most-once Delivery
-   At-least-once Delivery
-   Dead Letter Queue
-   Consumer Groups
-   Partitioned Log (Kafka-style)

### Coordination

-   Distributed Lock
-   Leader Election
-   Heartbeat Monitoring
-   Service Registry
-   Service Discovery

### Consistency

-   Primary-Replica Replication
-   Read / Write Quorum
-   Vector Clocks
-   CRDT Counters

### Consensus

-   Two Phase Commit
-   Three Phase Commit
-   Simplified Raft

### Storage

-   Key-Value Store
-   Append-Only Log
-   Write Ahead Log (WAL)
-   SSTable
-   LSM Tree (Simplified)

### Observability

-   Metrics Collector
-   Histogram
-   Structured Logger
-   Trace ID Propagation

### Security

-   JWT Validation
-   API Key Validation
-   Idempotency Key Manager
-   HMAC Verification

------------------------------------------------------------------------

## 🧪 Benchmarks

Each primitive includes:

-   Latency measurement
-   Throughput measurement
-   Memory usage
-   Concurrency stress testing

------------------------------------------------------------------------


## 📜 License

MIT

------------------------------------------------------------------------

Star the repository. Build from scratch. Break things. Fix them. Repeat.
