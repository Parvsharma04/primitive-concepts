'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface LogEntry {
    id: number;
    timestamp: number;
    allowed: boolean;
}

const WINDOW_SIZE = 5000;
const MAX_REQUESTS = 6;
const TICK_INTERVAL = 80;

export default function SlidingWindowLogPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [tick, setTick] = useState(0);
    const nextId = useRef(0);
    const animRef = useRef<number>(0);
    const lastTickRef = useRef(0);

    useEffect(() => {
        const loop = (timestamp: number) => {
            if (timestamp - lastTickRef.current >= TICK_INTERVAL) {
                lastTickRef.current = timestamp;
                setTick(t => t + 1);
            }
            animRef.current = requestAnimationFrame(loop);
        };
        animRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animRef.current);
    }, []);

    const sendRequest = useCallback(() => {
        const now = Date.now();
        const windowStart = now - WINDOW_SIZE;
        const activeEntries = logs.filter(l => l.timestamp > windowStart && l.allowed);
        const allowed = activeEntries.length < MAX_REQUESTS;

        setLogs(prev => [
            ...prev.slice(-50),
            { id: nextId.current++, timestamp: now, allowed },
        ]);
    }, [logs]);

    const reset = () => setLogs([]);

    const now = Date.now();
    const windowStart = now - WINDOW_SIZE;
    const activeLogs = logs.filter(l => l.timestamp > windowStart && l.allowed);
    const totalAllowed = logs.filter(l => l.allowed).length;
    const totalRejected = logs.filter(l => !l.allowed).length;

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">rate limiting</span>
                <h1>Sliding Window Log</h1>
                <p className="subtitle">Store every request timestamp — 100% accurate, no boundary problem</p>
            </div>

            <div className="stats-row">
                <div className="stat">
                    <span className="stat-label">Active in Window</span>
                    <span className={`stat-value ${activeLogs.length >= MAX_REQUESTS ? 'danger' : 'accent'}`}>
                        {activeLogs.length} / {MAX_REQUESTS}
                    </span>
                </div>
                <div className="stat">
                    <span className="stat-label">Total Logged</span>
                    <span className="stat-value">{logs.length}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Allowed</span>
                    <span className="stat-value accent">{totalAllowed}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Rejected</span>
                    <span className="stat-value danger">{totalRejected}</span>
                </div>
            </div>

            <div className="viz-container">
                <div className="viz-controls">
                    <button className="btn btn-accent" onClick={sendRequest}>
                        → Send Request
                    </button>
                    <button className="btn" onClick={reset}>Reset</button>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                        {MAX_REQUESTS} req / {WINDOW_SIZE / 1000}s sliding window
                    </span>
                </div>

                {/* Sliding window timeline */}
                <svg width="100%" height={160} viewBox="0 0 700 160" style={{ overflow: 'visible' }}>
                    {/* Window boundary */}
                    <rect x={50} y={30} width={600} height={80} fill="rgba(0,255,136,0.03)" stroke="var(--accent)" strokeWidth={1} rx={2} strokeDasharray="4,4" />
                    <text x={350} y={24} textAnchor="middle" fill="var(--text-dim)" fontSize={10} fontFamily="var(--font-mono)">
                        ← sliding window ({WINDOW_SIZE / 1000}s) →
                    </text>

                    {/* Timestamp entries — smooth sliding */}
                    {logs.slice(-20).map((entry) => {
                        const age = now - entry.timestamp;
                        const isActive = age < WINDOW_SIZE && entry.allowed;
                        const progress = Math.min(1, age / WINDOW_SIZE);
                        const x = 50 + (1 - progress) * 600;
                        const opacity = entry.allowed
                            ? (isActive ? Math.max(0.3, 1 - progress * 0.7) : 0.1)
                            : 0.4;

                        return (
                            <g key={entry.id} style={{ transition: 'opacity 300ms ease' }}>
                                <line
                                    x1={x} y1={30} x2={x} y2={110}
                                    stroke={entry.allowed ? 'var(--accent)' : 'var(--danger)'}
                                    strokeWidth={2}
                                    opacity={opacity}
                                />
                                <circle
                                    cx={x} cy={70}
                                    r={4}
                                    fill={entry.allowed ? 'var(--accent)' : 'var(--danger)'}
                                    opacity={opacity}
                                    style={{
                                        filter: isActive ? `drop-shadow(0 0 6px ${entry.allowed ? 'rgba(0,255,136,0.5)' : 'rgba(255,68,68,0.5)'})` : 'none',
                                    }}
                                />
                                <text
                                    x={x} y={125}
                                    textAnchor="middle"
                                    fill={entry.allowed ? 'var(--accent)' : 'var(--danger)'}
                                    fontSize={8}
                                    fontFamily="var(--font-mono)"
                                    opacity={opacity}
                                    transform={`rotate(-45, ${x}, 125)`}
                                >
                                    {(age / 1000).toFixed(1)}s
                                </text>
                            </g>
                        );
                    })}

                    {/* "NOW" marker */}
                    <line x1={650} y1={28} x2={650} y2={112} stroke="var(--text-bright)" strokeWidth={1.5} />
                    <text x={650} y={148} textAnchor="middle" fill="var(--text-bright)" fontSize={10} fontFamily="var(--font-mono)">NOW</text>

                    {/* Expiry edge */}
                    <line x1={50} y1={28} x2={50} y2={112} stroke="var(--danger)" strokeWidth={1} strokeDasharray="3,3" opacity={0.5} />
                    <text x={50} y={148} textAnchor="middle" fill="var(--danger)" fontSize={10} fontFamily="var(--font-mono)" opacity={0.5}>EXPIRE</text>
                </svg>
            </div>

            {/* Event log */}
            <div className="viz-container" style={{ minHeight: 'auto' }}>
                <h3 style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>// timestamp log</h3>
                <div className="log-area">
                    {logs.length === 0 && (
                        <div className="log-entry" style={{ color: 'var(--text-dim)' }}>
                            No requests yet. Click &quot;Send Request&quot; to begin.
                        </div>
                    )}
                    {logs.slice(-15).reverse().map(entry => {
                        const age = now - entry.timestamp;
                        const isExpired = age >= WINDOW_SIZE;
                        return (
                            <div key={entry.id} className={`log-entry ${entry.allowed ? 'allowed' : 'rejected'}`} style={{ opacity: isExpired ? 0.3 : 1 }}>
                                <span className="timestamp">[{new Date(entry.timestamp).toISOString().slice(11, 23)}]</span>
                                {entry.allowed ? '✓ ALLOWED' : '✗ REJECTED'}
                                {isExpired && ' (expired)'}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="info-columns">
                <div className="info-panel">
                    <h3>// how it works</h3>
                    <p style={{ marginBottom: 8 }}>
                        Store a sorted list of timestamps for each client. On each request:
                    </p>
                    <ul>
                        <li>Filter out timestamps older than (now − windowSize)</li>
                        <li>Count remaining timestamps</li>
                        <li>If count {'<'} limit → allow and add current timestamp</li>
                        <li>If count ≥ limit → reject</li>
                    </ul>
                </div>

                <div className="info-panel">
                    <h3>// trade-offs</h3>
                    <ul>
                        <li>100% accurate — no boundary problem</li>
                        <li>Simple and intuitive mental model</li>
                        <li className="con">O(n) memory — stores every timestamp</li>
                        <li className="con">Memory intensive for high-traffic APIs</li>
                        <li className="con">Cleanup overhead on each request</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
