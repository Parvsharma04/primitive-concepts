'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

const WINDOW_SIZE = 5000;
const MAX_REQUESTS = 6;
const TICK_INTERVAL = 80;

export default function SlidingWindowCounterPage() {
    const [tick, setTick] = useState(0);
    const [eventLog, setEventLog] = useState<Array<{ id: number; allowed: boolean; weight: number; weighted: number; time: number }>>([]);
    const nextId = useRef(0);
    const animRef = useRef<number>(0);
    const lastTickRef = useRef(0);

    // Use refs for mutable state to avoid race conditions
    const currentCountRef = useRef(0);
    const previousCountRef = useRef(0);
    const currentWindowIdRef = useRef(Math.floor(Date.now() / WINDOW_SIZE));

    // Snapshot values for rendering (updated on tick)
    const [displayCurrentCount, setDisplayCurrentCount] = useState(0);
    const [displayPreviousCount, setDisplayPreviousCount] = useState(0);

    useEffect(() => {
        const loop = (timestamp: number) => {
            if (timestamp - lastTickRef.current >= TICK_INTERVAL) {
                lastTickRef.current = timestamp;
                const now = Date.now();
                const newWindowId = Math.floor(now / WINDOW_SIZE);
                const gap = newWindowId - currentWindowIdRef.current;

                if (gap === 1) {
                    previousCountRef.current = currentCountRef.current;
                    currentCountRef.current = 0;
                    currentWindowIdRef.current = newWindowId;
                } else if (gap > 1) {
                    previousCountRef.current = 0;
                    currentCountRef.current = 0;
                    currentWindowIdRef.current = newWindowId;
                }

                setDisplayCurrentCount(currentCountRef.current);
                setDisplayPreviousCount(previousCountRef.current);
                setTick(t => t + 1);
            }
            animRef.current = requestAnimationFrame(loop);
        };
        animRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animRef.current);
    }, []);

    const now = Date.now();
    const windowElapsed = now % WINDOW_SIZE;
    const weight = (WINDOW_SIZE - windowElapsed) / WINDOW_SIZE;
    const weightedCount = displayCurrentCount + displayPreviousCount * weight;

    const sendRequest = useCallback(() => {
        const reqNow = Date.now();
        const we = reqNow % WINDOW_SIZE;
        const w = (WINDOW_SIZE - we) / WINDOW_SIZE;
        const wc = currentCountRef.current + previousCountRef.current * w;
        const isAllowed = wc < MAX_REQUESTS;

        if (isAllowed) {
            currentCountRef.current += 1;
            setDisplayCurrentCount(currentCountRef.current);
        }

        setEventLog(prev => [
            ...prev.slice(-20),
            { id: nextId.current++, allowed: isAllowed, weight: w, weighted: wc, time: reqNow },
        ]);
    }, []);

    const reset = () => {
        currentCountRef.current = 0;
        previousCountRef.current = 0;
        setDisplayCurrentCount(0);
        setDisplayPreviousCount(0);
        setEventLog([]);
    };

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">rate limiting</span>
                <h1>Sliding Window Counter</h1>
                <p className="subtitle">Hybrid approach — weighted counters from current + previous windows</p>
            </div>

            <div className="stats-row">
                <div className="stat">
                    <span className="stat-label">Weighted Count</span>
                    <span className={`stat-value ${weightedCount >= MAX_REQUESTS ? 'danger' : 'accent'}`}>
                        {weightedCount.toFixed(2)} / {MAX_REQUESTS}
                    </span>
                </div>
                <div className="stat">
                    <span className="stat-label">Current Window</span>
                    <span className="stat-value">{displayCurrentCount}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Previous Window</span>
                    <span className="stat-value">{displayPreviousCount}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Weight</span>
                    <span className="stat-value warning">{weight.toFixed(3)}</span>
                </div>
            </div>

            <div className="viz-container">
                <div className="viz-controls">
                    <button className="btn btn-accent" onClick={sendRequest}>→ Send Request</button>
                    <button className="btn" onClick={reset}>Reset</button>
                </div>

                {/* Formula display */}
                <div style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '12px 16px',
                    marginBottom: 20,
                    fontSize: 13,
                    color: 'var(--text-bright)',
                    fontFamily: 'var(--font-mono)',
                }}>
                    <span style={{ color: 'var(--text-dim)' }}>rollingCount = </span>
                    <span style={{ color: 'var(--accent)' }}>{displayCurrentCount}</span>
                    <span style={{ color: 'var(--text-dim)' }}> + </span>
                    <span style={{ color: 'var(--info)' }}>{displayPreviousCount}</span>
                    <span style={{ color: 'var(--text-dim)' }}> × </span>
                    <span style={{ color: 'var(--warning)' }}>{weight.toFixed(3)}</span>
                    <span style={{ color: 'var(--text-dim)' }}> = </span>
                    <span style={{ color: weightedCount >= MAX_REQUESTS ? 'var(--danger)' : 'var(--accent)', fontWeight: 700 }}>
                        {weightedCount.toFixed(2)}
                    </span>
                </div>

                {/* Visual bars */}
                <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start' }}>
                    {/* Previous window */}
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>Previous Window</div>
                        <div style={{
                            width: '100%',
                            height: 40,
                            background: 'var(--bg)',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--border)',
                            position: 'relative',
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                height: '100%',
                                width: `${(displayPreviousCount / MAX_REQUESTS) * 100}%`,
                                background: 'var(--info)',
                                opacity: weight,
                                transition: 'width 300ms ease, opacity 200ms ease',
                                borderRadius: 'var(--radius)',
                            }} />
                            <span style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%,-50%)',
                                fontSize: 12,
                                color: 'var(--text-bright)',
                            }}>
                                {displayPreviousCount} × {weight.toFixed(2)} = {(displayPreviousCount * weight).toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Current window */}
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>Current Window</div>
                        <div style={{
                            width: '100%',
                            height: 40,
                            background: 'var(--bg)',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--border)',
                            position: 'relative',
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                height: '100%',
                                width: `${(displayCurrentCount / MAX_REQUESTS) * 100}%`,
                                background: 'var(--accent)',
                                transition: 'width 300ms ease',
                                borderRadius: 'var(--radius)',
                            }} />
                            <span style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%,-50%)',
                                fontSize: 12,
                                color: 'var(--text-bright)',
                            }}>
                                {displayCurrentCount}
                            </span>
                        </div>
                        {/* Progress bar */}
                        <div style={{
                            height: 3,
                            background: 'var(--border)',
                            marginTop: 8,
                            borderRadius: 2,
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                height: '100%',
                                width: `${(windowElapsed / WINDOW_SIZE) * 100}%`,
                                background: 'var(--accent)',
                            }} />
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>
                            {(windowElapsed / 1000).toFixed(1)}s / {WINDOW_SIZE / 1000}s
                        </div>
                    </div>
                </div>

                {/* Combined weighted bar */}
                <div style={{ marginTop: 24 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>Combined Weighted Count</div>
                    <div style={{
                        width: '100%',
                        height: 24,
                        background: 'var(--bg)',
                        borderRadius: 'var(--radius)',
                        border: `1px solid ${weightedCount >= MAX_REQUESTS ? 'var(--danger)' : 'var(--border)'}`,
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'border-color 300ms ease',
                    }}>
                        <div style={{
                            height: '100%',
                            width: `${Math.min(100, (weightedCount / MAX_REQUESTS) * 100)}%`,
                            background: weightedCount >= MAX_REQUESTS
                                ? 'linear-gradient(90deg, var(--danger-dim), var(--danger))'
                                : 'linear-gradient(90deg, var(--info), var(--accent))',
                            borderRadius: 'var(--radius)',
                            transition: 'width 200ms ease, background 300ms ease',
                        }} />
                        <div style={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            bottom: 0,
                            width: 2,
                            background: 'var(--danger)',
                        }} />
                    </div>
                </div>
            </div>

            {/* Event log */}
            <div className="viz-container" style={{ minHeight: 'auto' }}>
                <h3 style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>// request log</h3>
                <div className="log-area">
                    {eventLog.length === 0 && (
                        <div className="log-entry" style={{ color: 'var(--text-dim)' }}>No requests yet.</div>
                    )}
                    {eventLog.slice(-10).reverse().map(e => (
                        <div key={e.id} className={`log-entry ${e.allowed ? 'allowed' : 'rejected'}`}>
                            <span className="timestamp">[{new Date(e.time).toISOString().slice(11, 23)}]</span>
                            {e.allowed ? '✓' : '✗'} weighted={e.weighted.toFixed(2)} w={e.weight.toFixed(3)}
                        </div>
                    ))}
                </div>
            </div>

            <div className="info-columns">
                <div className="info-panel">
                    <h3>// how it works</h3>
                    <p style={{ marginBottom: 8 }}>
                        Hybrid between Fixed Window and Sliding Window Log:
                    </p>
                    <ul>
                        <li>Keep counters for current and previous windows</li>
                        <li>Calculate overlap weight: (windowSize − elapsed) / windowSize</li>
                        <li>rollingCount = current + (previous × weight)</li>
                        <li>If rollingCount {'<'} limit → allow</li>
                    </ul>
                </div>

                <div className="info-panel">
                    <h3>// trade-offs</h3>
                    <ul>
                        <li>O(1) time and space — just 2 counters</li>
                        <li>Much more accurate than Fixed Window</li>
                        <li>Memory efficient — no timestamp storage</li>
                        <li className="con">Approximation — not 100% exact</li>
                        <li className="con">Slightly more complex than Fixed Window</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
