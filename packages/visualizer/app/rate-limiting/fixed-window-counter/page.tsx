'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface RequestDot {
    id: number;
    time: number;
    windowIdx: number;
    allowed: boolean;
    x: number;
    y: number; // stable Y position, computed once at creation
}

const WINDOW_SIZE = 4000;
const MAX_REQUESTS = 5;
const TIMELINE_WIDTH = 700;
const WINDOW_DISPLAY_COUNT = 3;
const TICK_INTERVAL = 80; // ms between UI updates (~12fps)

export default function FixedWindowCounterPage() {
    const [requests, setRequests] = useState<RequestDot[]>([]);
    const [windowCounters, setWindowCounters] = useState<Record<number, number>>({});
    const [tick, setTick] = useState(0); // just a trigger for re-render
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
        const windowIdx = Math.floor(now / WINDOW_SIZE);
        const currentCount = windowCounters[windowIdx] || 0;
        const allowed = currentCount < MAX_REQUESTS;

        if (allowed) {
            setWindowCounters(prev => ({
                ...prev,
                [windowIdx]: (prev[windowIdx] || 0) + 1,
            }));
        }

        const windowStart = windowIdx * WINDOW_SIZE;
        const posInWindow = (now - windowStart) / WINDOW_SIZE;

        // deterministic Y based on id to avoid random jumps
        const dotId = nextId.current++;
        const y = 45 + ((dotId * 37 + 13) % 65); // pseudo-random but stable

        setRequests(prev => [
            ...prev.slice(-30),
            { id: dotId, time: now, windowIdx, allowed, x: posInWindow, y },
        ]);
    }, [windowCounters]);

    const reset = () => {
        setRequests([]);
        setWindowCounters({});
    };

    const now = Date.now();
    const currentWindowIdx = Math.floor(now / WINDOW_SIZE);
    const windowProgress = (now % WINDOW_SIZE) / WINDOW_SIZE;
    const totalAllowed = requests.filter(r => r.allowed).length;
    const totalRejected = requests.filter(r => !r.allowed).length;
    const currentCount = windowCounters[currentWindowIdx] || 0;

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">rate limiting</span>
                <h1>Fixed Window Counter</h1>
                <p className="subtitle">Divide time into fixed-size windows with a counter per window</p>
            </div>

            <div className="stats-row">
                <div className="stat">
                    <span className="stat-label">Window Counter</span>
                    <span className={`stat-value ${currentCount >= MAX_REQUESTS ? 'danger' : 'accent'}`}>
                        {currentCount} / {MAX_REQUESTS}
                    </span>
                </div>
                <div className="stat">
                    <span className="stat-label">Window Progress</span>
                    <span className="stat-value">{(windowProgress * 100).toFixed(0)}%</span>
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
                        {MAX_REQUESTS} req / {WINDOW_SIZE / 1000}s window
                    </span>
                </div>

                {/* Timeline visualization */}
                <svg width="100%" height={180} viewBox={`0 0 ${TIMELINE_WIDTH} 180`} style={{ overflow: 'visible' }}>
                    {/* Window backgrounds */}
                    {Array.from({ length: WINDOW_DISPLAY_COUNT }, (_, i) => {
                        const wIdx = currentWindowIdx - (WINDOW_DISPLAY_COUNT - 1) + i;
                        const x = (i / WINDOW_DISPLAY_COUNT) * TIMELINE_WIDTH;
                        const w = TIMELINE_WIDTH / WINDOW_DISPLAY_COUNT;
                        const isActive = wIdx === currentWindowIdx;
                        const count = windowCounters[wIdx] || 0;
                        const isFull = count >= MAX_REQUESTS;
                        return (
                            <g key={wIdx}>
                                <rect
                                    x={x} y={20} width={w} height={120}
                                    fill={isActive ? 'rgba(0,255,136,0.04)' : 'rgba(255,255,255,0.01)'}
                                    stroke={isActive ? 'var(--accent)' : 'var(--border)'}
                                    strokeWidth={isActive ? 1.5 : 0.5}
                                    strokeDasharray={isActive ? 'none' : '4,4'}
                                    rx={2}
                                    style={{ transition: 'fill 300ms ease, stroke 300ms ease' }}
                                />
                                <text x={x + w / 2} y={158} textAnchor="middle" fill="var(--text-dim)" fontSize={10} fontFamily="var(--font-mono)">
                                    W{wIdx % 100}
                                </text>
                                <text
                                    x={x + w / 2} y={14}
                                    textAnchor="middle"
                                    fill={isFull ? 'var(--danger)' : 'var(--text-dim)'}
                                    fontSize={11}
                                    fontFamily="var(--font-mono)"
                                >
                                    [{count}/{MAX_REQUESTS}]
                                </text>
                                {isActive && (
                                    <line
                                        x1={x + windowProgress * w} y1={18}
                                        x2={x + windowProgress * w} y2={142}
                                        stroke="var(--accent)"
                                        strokeWidth={1}
                                        opacity={0.5}
                                        strokeDasharray="2,2"
                                    />
                                )}
                            </g>
                        );
                    })}

                    {/* Request dots — stable positions */}
                    {requests.filter(r => {
                        const rWinOffset = r.windowIdx - (currentWindowIdx - WINDOW_DISPLAY_COUNT + 1);
                        return rWinOffset >= 0 && rWinOffset < WINDOW_DISPLAY_COUNT;
                    }).map(r => {
                        const rWinOffset = r.windowIdx - (currentWindowIdx - WINDOW_DISPLAY_COUNT + 1);
                        const wWidth = TIMELINE_WIDTH / WINDOW_DISPLAY_COUNT;
                        const cx = rWinOffset * wWidth + r.x * wWidth;
                        const age = now - r.time;
                        const fadeOpacity = Math.max(0.3, 1 - age / (WINDOW_SIZE * 3));
                        return (
                            <circle
                                key={r.id}
                                cx={cx}
                                cy={r.y}
                                r={4}
                                fill={r.allowed ? 'var(--accent)' : 'var(--danger)'}
                                opacity={fadeOpacity}
                                style={{
                                    filter: `drop-shadow(0 0 4px ${r.allowed ? 'var(--accent)' : 'var(--danger)'})`,
                                    transition: 'opacity 300ms ease',
                                }}
                            />
                        );
                    })}
                </svg>
            </div>

            <div className="info-panel" style={{ borderColor: 'var(--warning)', marginBottom: 16 }}>
                <h3 style={{ color: 'var(--warning)' }}>⚠ boundary problem</h3>
                <p>
                    Try sending {MAX_REQUESTS} requests at the end of one window and {MAX_REQUESTS} more at the start of the next.
                    You&apos;ll get {MAX_REQUESTS * 2} requests through in a very short burst — double the limit!
                    This is the fundamental flaw of fixed windows.
                </p>
            </div>

            <div className="info-columns">
                <div className="info-panel">
                    <h3>// how it works</h3>
                    <p style={{ marginBottom: 8 }}>
                        Time is divided into fixed windows (e.g. 1 minute). Each window has a counter.
                    </p>
                    <ul>
                        <li>New request arrives → find current window</li>
                        <li>If counter {'<'} limit → allow, increment counter</li>
                        <li>If counter ≥ limit → reject</li>
                        <li>Window expires → counter resets to 0</li>
                    </ul>
                </div>

                <div className="info-panel">
                    <h3>// trade-offs</h3>
                    <ul>
                        <li>O(1) time and space — extremely simple</li>
                        <li>Low memory: only 1 counter per key</li>
                        <li className="con">Boundary problem: 2× burst at window edges</li>
                        <li className="con">Not suitable when smooth rate enforcement is critical</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
