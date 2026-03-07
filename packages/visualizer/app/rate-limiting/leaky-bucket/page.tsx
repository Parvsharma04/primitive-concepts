'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

const MAX_LEVEL = 8;
const LEAK_RATE = 1.2;
const TICK_INTERVAL = 80;

interface LeakEvent {
    id: number;
    time: number;
    allowed: boolean;
    levelAfter: number;
}

export default function LeakyBucketPage() {
    const [displayLevel, setDisplayLevel] = useState(0);
    const [events, setEvents] = useState<LeakEvent[]>([]);
    const [tick, setTick] = useState(0);
    const nextId = useRef(0);
    const animRef = useRef<number>(0);
    const lastTickRef = useRef(0);
    const levelRef = useRef(0);
    const lastTimeRef = useRef(Date.now());

    useEffect(() => {
        const loop = (timestamp: number) => {
            if (timestamp - lastTickRef.current >= TICK_INTERVAL) {
                lastTickRef.current = timestamp;
                const now = Date.now();
                const elapsed = (now - lastTimeRef.current) / 1000;
                const leaked = elapsed * LEAK_RATE;
                levelRef.current = Math.max(0, levelRef.current - leaked);
                lastTimeRef.current = now;
                setDisplayLevel(levelRef.current);
                setTick(t => t + 1);
            }
            animRef.current = requestAnimationFrame(loop);
        };
        animRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animRef.current);
    }, []);

    const sendRequest = useCallback(() => {
        const now = Date.now();
        // Drain up to now first
        const elapsed = (now - lastTimeRef.current) / 1000;
        levelRef.current = Math.max(0, levelRef.current - elapsed * LEAK_RATE);
        lastTimeRef.current = now;

        if (levelRef.current + 1 <= MAX_LEVEL) {
            levelRef.current += 1;
            setDisplayLevel(levelRef.current);
            setEvents(prev => [...prev.slice(-20), {
                id: nextId.current++,
                time: now,
                allowed: true,
                levelAfter: levelRef.current,
            }]);
        } else {
            setDisplayLevel(levelRef.current);
            setEvents(prev => [...prev.slice(-20), {
                id: nextId.current++,
                time: now,
                allowed: false,
                levelAfter: levelRef.current,
            }]);
        }
    }, []);

    const reset = () => {
        levelRef.current = 0;
        lastTimeRef.current = Date.now();
        setDisplayLevel(0);
        setEvents([]);
    };

    const fillPercent = (displayLevel / MAX_LEVEL) * 100;
    const isOverflowing = displayLevel >= MAX_LEVEL;
    const totalAllowed = events.filter(e => e.allowed).length;
    const totalRejected = events.filter(e => !e.allowed).length;
    const dripActive = displayLevel > 0.01;

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">rate limiting</span>
                <h1>Leaky Bucket</h1>
                <p className="subtitle">Requests fill a bucket that drains at a constant rate — smooths bursty traffic</p>
            </div>

            <div className="stats-row">
                <div className="stat">
                    <span className="stat-label">Bucket Level</span>
                    <span className={`stat-value ${isOverflowing ? 'danger' : 'accent'}`}>
                        {displayLevel.toFixed(2)} / {MAX_LEVEL}
                    </span>
                </div>
                <div className="stat">
                    <span className="stat-label">Leak Rate</span>
                    <span className="stat-value warning">{LEAK_RATE}/s</span>
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
                    <button className="btn btn-accent" onClick={sendRequest}>→ Send Request (+1 water)</button>
                    <button className="btn" onClick={reset}>Reset</button>
                </div>

                <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start' }}>
                    {/* Bucket */}
                    <div style={{ width: 200, flexShrink: 0 }}>
                        <div style={{
                            fontSize: 11,
                            color: isOverflowing ? 'var(--danger)' : 'var(--text-dim)',
                            marginBottom: 8,
                            textAlign: 'center',
                            transition: 'color 300ms ease',
                        }}>
                            {isOverflowing ? '⚠ OVERFLOW' : 'bucket'}
                        </div>

                        {/* Input arrow */}
                        <div style={{
                            textAlign: 'center',
                            marginBottom: 4,
                            fontSize: 14,
                            color: isOverflowing ? 'var(--danger)' : 'var(--accent)',
                            animation: 'pulse 2s ease-in-out infinite',
                            transition: 'color 300ms ease',
                        }}>
                            ↓ requests
                        </div>

                        <div style={{
                            width: 160,
                            height: 200,
                            margin: '0 auto',
                            background: 'var(--bg)',
                            border: `2px solid ${isOverflowing ? 'var(--danger)' : 'var(--border-bright)'}`,
                            borderTop: 'none',
                            borderRadius: '0 0 12px 12px',
                            position: 'relative',
                            overflow: 'hidden',
                            transition: 'border-color 400ms ease',
                        }}>
                            {/* Water fill */}
                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: `${fillPercent}%`,
                                background: isOverflowing
                                    ? 'linear-gradient(180deg, var(--danger) 0%, var(--danger-dim) 100%)'
                                    : 'linear-gradient(180deg, var(--info) 0%, var(--info-dim) 100%)',
                                opacity: 0.4,
                                transition: 'height 300ms cubic-bezier(0.4, 0, 0.2, 1), background 400ms ease',
                            }} />

                            {/* Water level markers */}
                            {Array.from({ length: MAX_LEVEL }, (_, i) => (
                                <div key={i} style={{
                                    position: 'absolute',
                                    bottom: `${((i + 1) / MAX_LEVEL) * 100}%`,
                                    left: 0,
                                    right: 0,
                                    height: 1,
                                    background: 'var(--border)',
                                    opacity: 0.3,
                                }}>
                                    <span style={{
                                        position: 'absolute',
                                        right: 4,
                                        top: -7,
                                        fontSize: 8,
                                        color: 'var(--text-dim)',
                                    }}>{i + 1}</span>
                                </div>
                            ))}

                            {/* Capacity line */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: -4,
                                right: -4,
                                height: 2,
                                background: 'var(--danger)',
                            }} />
                            <span style={{
                                position: 'absolute',
                                top: 4,
                                left: 8,
                                fontSize: 9,
                                color: 'var(--danger)',
                            }}>max</span>
                        </div>

                        {/* Leak indicator */}
                        <div style={{
                            textAlign: 'center',
                            marginTop: 4,
                            fontSize: 14,
                            color: dripActive ? 'var(--info)' : 'var(--text-dim)',
                            transition: 'color 300ms ease',
                        }}>
                            {dripActive ? (
                                <span style={{ animation: 'pulse 0.8s ease-in-out infinite' }}>💧</span>
                            ) : (
                                <span>·</span>
                            )}
                        </div>
                        <div style={{
                            textAlign: 'center',
                            fontSize: 10,
                            color: dripActive ? 'var(--info)' : 'var(--text-dim)',
                            transition: 'color 300ms ease',
                        }}>
                            {dripActive ? `draining (−${LEAK_RATE}/s)` : 'empty'}
                        </div>
                    </div>

                    {/* Right side */}
                    <div style={{ flex: 1 }}>
                        {/* Fill gauge */}
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>Fill Level</div>
                            <div style={{
                                width: '100%',
                                height: 20,
                                background: 'var(--bg)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius)',
                                overflow: 'hidden',
                                position: 'relative',
                            }}>
                                <div style={{
                                    height: '100%',
                                    width: `${fillPercent}%`,
                                    background: isOverflowing
                                        ? 'linear-gradient(90deg, var(--danger-dim), var(--danger))'
                                        : 'linear-gradient(90deg, var(--info-dim), var(--info))',
                                    transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1), background 400ms ease',
                                    borderRadius: 'var(--radius)',
                                }} />
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>
                                {displayLevel.toFixed(2)} / {MAX_LEVEL} — draining at {LEAK_RATE}/s
                            </div>
                        </div>

                        {/* Effective output rate */}
                        <div style={{
                            background: 'var(--bg)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius)',
                            padding: 12,
                            marginBottom: 16,
                            fontSize: 12,
                        }}>
                            <span style={{ color: 'var(--text-dim)' }}>output rate: </span>
                            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
                                {dripActive ? `${LEAK_RATE} req/s` : '0 req/s'}
                            </span>
                            <span style={{ color: 'var(--text-dim)' }}> (constant, regardless of input burst)</span>
                        </div>

                        {/* Events */}
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>// events</div>
                        <div className="log-area">
                            {events.length === 0 && (
                                <div className="log-entry" style={{ color: 'var(--text-dim)' }}>No requests yet.</div>
                            )}
                            {events.slice(-10).reverse().map(e => (
                                <div key={e.id} className={`log-entry ${e.allowed ? 'allowed' : 'rejected'}`}>
                                    <span className="timestamp">[{new Date(e.time).toISOString().slice(11, 23)}]</span>
                                    {e.allowed ? '✓ +1 level' : '✗ OVERFLOW'} → level={e.levelAfter.toFixed(1)}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="info-columns">
                <div className="info-panel">
                    <h3>// how it works</h3>
                    <p style={{ marginBottom: 8 }}>
                        Think of a bucket with a small hole at the bottom:
                    </p>
                    <ul>
                        <li>Requests add water to the bucket (level increases)</li>
                        <li>Water leaks out at a constant rate: elapsed × leakRate</li>
                        <li>If level + 1 {'>'} capacity → request rejected (overflow)</li>
                        <li>Output is always at a steady rate, smoothing bursts</li>
                    </ul>
                </div>

                <div className="info-panel">
                    <h3>// trade-offs</h3>
                    <ul>
                        <li>Smooths bursty traffic into steady output</li>
                        <li>O(1) time and space</li>
                        <li>Great for queue-based processing</li>
                        <li className="con">No controlled bursting — rejects excess immediately</li>
                        <li className="con">Can be too strict for bursty workloads</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
