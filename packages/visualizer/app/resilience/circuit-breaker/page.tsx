'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

const FAILURE_THRESHOLD = 3;
const RESET_TIMEOUT = 5000; // 5 seconds

interface CBEvent {
    id: number;
    time: number;
    type: 'success' | 'failure';
    stateBefore: CircuitState;
    stateAfter: CircuitState;
}

export default function CircuitBreakerPage() {
    const [state, setState] = useState<CircuitState>('CLOSED');
    const [failureCount, setFailureCount] = useState(0);
    const [events, setEvents] = useState<CBEvent[]>([]);
    const [openedAt, setOpenedAt] = useState<number | null>(null);
    const [currentTime, setCurrentTime] = useState(Date.now());
    const nextId = useRef(0);
    const animRef = useRef<number>(0);
    const stateRef = useRef<CircuitState>('CLOSED');
    const failureRef = useRef(0);
    const openedAtRef = useRef<number | null>(null);

    const lastTickRef = useRef(0);

    useEffect(() => {
        const TICK_INTERVAL = 80; // ~12fps
        const loop = (timestamp: number) => {
            if (timestamp - lastTickRef.current >= TICK_INTERVAL) {
                lastTickRef.current = timestamp;
                const now = Date.now();
                setCurrentTime(now);

                // Auto-transition from OPEN → HALF_OPEN
                if (stateRef.current === 'OPEN' && openedAtRef.current && now >= openedAtRef.current + RESET_TIMEOUT) {
                    stateRef.current = 'HALF_OPEN';
                    setState('HALF_OPEN');
                }
            }
            animRef.current = requestAnimationFrame(loop);
        };
        animRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animRef.current);
    }, []);

    const triggerSuccess = useCallback(() => {
        const now = Date.now();
        const before = stateRef.current;

        if (before === 'OPEN') return;

        // Success in CLOSED or HALF_OPEN → reset to CLOSED
        stateRef.current = 'CLOSED';
        failureRef.current = 0;
        openedAtRef.current = null;
        setState('CLOSED');
        setFailureCount(0);
        setOpenedAt(null);

        setEvents(prev => [...prev.slice(-20), {
            id: nextId.current++,
            time: now,
            type: 'success',
            stateBefore: before,
            stateAfter: 'CLOSED',
        }]);
    }, []);

    const triggerFailure = useCallback(() => {
        const now = Date.now();
        const before = stateRef.current;

        if (before === 'OPEN') return;

        if (before === 'HALF_OPEN') {
            // Probe failed → back to OPEN
            stateRef.current = 'OPEN';
            openedAtRef.current = now;
            setState('OPEN');
            setOpenedAt(now);

            setEvents(prev => [...prev.slice(-20), {
                id: nextId.current++,
                time: now,
                type: 'failure',
                stateBefore: before,
                stateAfter: 'OPEN',
            }]);
            return;
        }

        // CLOSED: increment failures
        const newCount = failureRef.current + 1;
        failureRef.current = newCount;
        setFailureCount(newCount);

        if (newCount >= FAILURE_THRESHOLD) {
            stateRef.current = 'OPEN';
            openedAtRef.current = now;
            setState('OPEN');
            setOpenedAt(now);

            setEvents(prev => [...prev.slice(-20), {
                id: nextId.current++,
                time: now,
                type: 'failure',
                stateBefore: before,
                stateAfter: 'OPEN',
            }]);
        } else {
            setEvents(prev => [...prev.slice(-20), {
                id: nextId.current++,
                time: now,
                type: 'failure',
                stateBefore: before,
                stateAfter: 'CLOSED',
            }]);
        }
    }, []);

    const reset = () => {
        stateRef.current = 'CLOSED';
        failureRef.current = 0;
        openedAtRef.current = null;
        setState('CLOSED');
        setFailureCount(0);
        setOpenedAt(null);
        setEvents([]);
    };

    const timerRemaining = (state === 'OPEN' && openedAt)
        ? Math.max(0, RESET_TIMEOUT - (currentTime - openedAt))
        : 0;
    const timerPercent = (state === 'OPEN' && openedAt)
        ? Math.min(100, ((currentTime - openedAt) / RESET_TIMEOUT) * 100)
        : 0;

    const stateColor = {
        CLOSED: 'var(--accent)',
        OPEN: 'var(--danger)',
        HALF_OPEN: 'var(--warning)',
    };

    const stateGlow = {
        CLOSED: 'var(--accent-glow)',
        OPEN: 'var(--danger-glow)',
        HALF_OPEN: 'var(--warning-glow)',
    };

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">resilience</span>
                <h1>Circuit Breaker</h1>
                <p className="subtitle">Prevent cascading failures — CLOSED → OPEN → HALF_OPEN state machine</p>
            </div>

            <div className="stats-row">
                <div className="stat">
                    <span className="stat-label">State</span>
                    <span className="stat-value" style={{ color: stateColor[state] }}>{state}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Consecutive Failures</span>
                    <span className={`stat-value ${failureCount >= FAILURE_THRESHOLD ? 'danger' : ''}`}>
                        {failureCount} / {FAILURE_THRESHOLD}
                    </span>
                </div>
                {state === 'OPEN' && (
                    <div className="stat">
                        <span className="stat-label">Reset Timer</span>
                        <span className="stat-value warning">{(timerRemaining / 1000).toFixed(1)}s</span>
                    </div>
                )}
            </div>

            <div className="viz-container" style={{ minHeight: 350 }}>
                <div className="viz-controls">
                    <button
                        className="btn btn-accent"
                        onClick={triggerSuccess}
                        disabled={state === 'OPEN'}
                    >
                        ✓ Simulate Success
                    </button>
                    <button
                        className="btn btn-danger"
                        onClick={triggerFailure}
                        disabled={state === 'OPEN'}
                    >
                        ✗ Simulate Failure
                    </button>
                    <button className="btn" onClick={reset}>Reset</button>
                    {state === 'OPEN' && (
                        <span style={{ fontSize: 11, color: 'var(--danger)', animation: 'pulse 1s infinite' }}>
                            ● Circuit is OPEN — all requests fail fast
                        </span>
                    )}
                </div>

                {/* State Machine Diagram */}
                <svg width="100%" height={250} viewBox="0 0 700 250" style={{ overflow: 'visible' }}>
                    {/* CLOSED node */}
                    <g>
                        <rect
                            x={40} y={90} width={140} height={60} rx={4}
                            fill={state === 'CLOSED' ? 'rgba(0,255,136,0.08)' : 'var(--bg)'}
                            stroke={state === 'CLOSED' ? 'var(--accent)' : 'var(--border)'}
                            strokeWidth={state === 'CLOSED' ? 2 : 1}
                            style={{ filter: state === 'CLOSED' ? 'drop-shadow(0 0 12px var(--accent-glow))' : 'none', transition: 'all 300ms ease' }}
                        />
                        <text x={110} y={116} textAnchor="middle" fill={state === 'CLOSED' ? 'var(--accent)' : 'var(--text-dim)'} fontSize={13} fontFamily="var(--font-mono)" fontWeight={600}>
                            CLOSED
                        </text>
                        <text x={110} y={136} textAnchor="middle" fill="var(--text-dim)" fontSize={9} fontFamily="var(--font-mono)">
                            requests flow
                        </text>
                    </g>

                    {/* OPEN node */}
                    <g>
                        <rect
                            x={280} y={90} width={140} height={60} rx={4}
                            fill={state === 'OPEN' ? 'rgba(255,68,68,0.08)' : 'var(--bg)'}
                            stroke={state === 'OPEN' ? 'var(--danger)' : 'var(--border)'}
                            strokeWidth={state === 'OPEN' ? 2 : 1}
                            style={{ filter: state === 'OPEN' ? 'drop-shadow(0 0 12px var(--danger-glow))' : 'none', transition: 'all 300ms ease' }}
                        />
                        <text x={350} y={116} textAnchor="middle" fill={state === 'OPEN' ? 'var(--danger)' : 'var(--text-dim)'} fontSize={13} fontFamily="var(--font-mono)" fontWeight={600}>
                            OPEN
                        </text>
                        <text x={350} y={136} textAnchor="middle" fill="var(--text-dim)" fontSize={9} fontFamily="var(--font-mono)">
                            fail fast
                        </text>
                    </g>

                    {/* HALF_OPEN node */}
                    <g>
                        <rect
                            x={520} y={90} width={140} height={60} rx={4}
                            fill={state === 'HALF_OPEN' ? 'rgba(255,170,0,0.08)' : 'var(--bg)'}
                            stroke={state === 'HALF_OPEN' ? 'var(--warning)' : 'var(--border)'}
                            strokeWidth={state === 'HALF_OPEN' ? 2 : 1}
                            style={{ filter: state === 'HALF_OPEN' ? 'drop-shadow(0 0 12px var(--warning-glow))' : 'none', transition: 'all 300ms ease' }}
                        />
                        <text x={590} y={116} textAnchor="middle" fill={state === 'HALF_OPEN' ? 'var(--warning)' : 'var(--text-dim)'} fontSize={13} fontFamily="var(--font-mono)" fontWeight={600}>
                            HALF_OPEN
                        </text>
                        <text x={590} y={136} textAnchor="middle" fill="var(--text-dim)" fontSize={9} fontFamily="var(--font-mono)">
                            probe 1 request
                        </text>
                    </g>

                    {/* Arrows */}
                    {/* CLOSED → OPEN (failures ≥ threshold) */}
                    <defs>
                        <marker id="arrowGreen" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                            <polygon points="0,0 8,3 0,6" fill="var(--accent)" />
                        </marker>
                        <marker id="arrowRed" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                            <polygon points="0,0 8,3 0,6" fill="var(--danger)" />
                        </marker>
                        <marker id="arrowYellow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                            <polygon points="0,0 8,3 0,6" fill="var(--warning)" />
                        </marker>
                        <marker id="arrowDim" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                            <polygon points="0,0 8,3 0,6" fill="var(--text-dim)" />
                        </marker>
                    </defs>

                    {/* CLOSED → OPEN */}
                    <line x1={180} y1={110} x2={275} y2={110} stroke="var(--danger)" strokeWidth={1.5} markerEnd="url(#arrowRed)" />
                    <text x={228} y={100} textAnchor="middle" fill="var(--danger)" fontSize={9} fontFamily="var(--font-mono)">
                        failures ≥ {FAILURE_THRESHOLD}
                    </text>

                    {/* OPEN → HALF_OPEN */}
                    <line x1={420} y1={110} x2={515} y2={110} stroke="var(--warning)" strokeWidth={1.5} markerEnd="url(#arrowYellow)" />
                    <text x={468} y={100} textAnchor="middle" fill="var(--warning)" fontSize={9} fontFamily="var(--font-mono)">
                        timeout
                    </text>

                    {/* HALF_OPEN → CLOSED (success) */}
                    <path d="M 590 155 Q 590 210 110 210 Q 50 210 50 155" fill="none" stroke="var(--accent)" strokeWidth={1.5} markerEnd="url(#arrowGreen)" />
                    <text x={350} y={225} textAnchor="middle" fill="var(--accent)" fontSize={9} fontFamily="var(--font-mono)">
                        probe succeeds → reset
                    </text>

                    {/* HALF_OPEN → OPEN (failure) */}
                    <path d="M 520 145 Q 470 180 420 145" fill="none" stroke="var(--danger)" strokeWidth={1.5} strokeDasharray="4,3" markerEnd="url(#arrowRed)" />
                    <text x={470} y={185} textAnchor="middle" fill="var(--danger)" fontSize={9} fontFamily="var(--font-mono)">
                        probe fails
                    </text>

                    {/* CLOSED self-loop (success resets) */}
                    <path d="M 70 90 Q 70 50 110 50 Q 150 50 150 90" fill="none" stroke="var(--text-dim)" strokeWidth={1} strokeDasharray="3,3" markerEnd="url(#arrowDim)" />
                    <text x={110} y={45} textAnchor="middle" fill="var(--text-dim)" fontSize={8} fontFamily="var(--font-mono)">
                        success → reset count
                    </text>
                </svg>

                {/* Timer bar (when OPEN) */}
                {state === 'OPEN' && (
                    <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>
                            Reset timer ({(RESET_TIMEOUT / 1000)}s)
                        </div>
                        <div style={{
                            width: '100%',
                            height: 8,
                            background: 'var(--bg)',
                            border: '1px solid var(--border)',
                            borderRadius: 4,
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                height: '100%',
                                width: `${timerPercent}%`,
                                background: 'linear-gradient(90deg, var(--danger), var(--warning))',
                                transition: 'width 100ms linear',
                                borderRadius: 4,
                            }} />
                        </div>
                    </div>
                )}

                {/* Failure counter bar */}
                <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>
                        Failure Counter
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                        {Array.from({ length: FAILURE_THRESHOLD }, (_, i) => (
                            <div key={i} style={{
                                width: 32,
                                height: 32,
                                border: `1.5px solid ${i < failureCount ? 'var(--danger)' : 'var(--border)'}`,
                                borderRadius: 'var(--radius)',
                                background: i < failureCount ? 'var(--danger)' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 14,
                                color: i < failureCount ? 'var(--bg)' : 'var(--text-dim)',
                                transition: 'all 200ms ease',
                                boxShadow: i < failureCount ? '0 0 8px var(--danger-glow)' : 'none',
                            }}>
                                {i < failureCount ? '✗' : '·'}
                            </div>
                        ))}
                        <span style={{ alignSelf: 'center', fontSize: 11, color: 'var(--text-dim)', marginLeft: 8 }}>
                            {failureCount}/{FAILURE_THRESHOLD} to trip
                        </span>
                    </div>
                </div>
            </div>

            {/* Event log */}
            <div className="viz-container" style={{ minHeight: 'auto' }}>
                <h3 style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>// event log</h3>
                <div className="log-area">
                    {events.length === 0 && (
                        <div className="log-entry" style={{ color: 'var(--text-dim)' }}>
                            No events yet. Click &quot;Simulate Success&quot; or &quot;Simulate Failure&quot; to begin.
                        </div>
                    )}
                    {events.slice(-12).reverse().map(e => (
                        <div key={e.id} className={`log-entry ${e.type === 'success' ? 'allowed' : 'rejected'}`}>
                            <span className="timestamp">[{new Date(e.time).toISOString().slice(11, 23)}]</span>
                            {e.type === 'success' ? '✓ SUCCESS' : '✗ FAILURE'}
                            {' '}{e.stateBefore} → {e.stateAfter}
                        </div>
                    ))}
                </div>
            </div>

            <div className="info-columns">
                <div className="info-panel">
                    <h3>// how it works</h3>
                    <ul>
                        <li><strong style={{ color: 'var(--accent)' }}>CLOSED:</strong> Requests flow normally. Track consecutive failures.</li>
                        <li>If failures ≥ threshold → switch to OPEN</li>
                        <li><strong style={{ color: 'var(--danger)' }}>OPEN:</strong> All requests fail fast immediately. Start a timer.</li>
                        <li>After timeout → switch to HALF_OPEN</li>
                        <li><strong style={{ color: 'var(--warning)' }}>HALF_OPEN:</strong> Allow ONE probe request through.</li>
                        <li>Probe succeeds → CLOSED (reset). Probe fails → back to OPEN.</li>
                    </ul>
                </div>

                <div className="info-panel">
                    <h3>// trade-offs</h3>
                    <ul>
                        <li>Prevents cascading failures across services</li>
                        <li>Fast failure response — no waiting for timeouts</li>
                        <li>Automatic recovery via HALF_OPEN probing</li>
                        <li className="con">Needs careful threshold tuning</li>
                        <li className="con">Can mask intermittent errors</li>
                        <li className="con">Single probe in HALF_OPEN may not be representative</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
