'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

const MAX_TOKENS = 8;
const REFILL_RATE = 1.5; // tokens per second
const TICK_INTERVAL = 80;

interface TokenEvent {
    id: number;
    time: number;
    allowed: boolean;
    tokensAfter: number;
}

export default function TokenBucketPage() {
    const [displayTokens, setDisplayTokens] = useState(MAX_TOKENS);
    const [events, setEvents] = useState<TokenEvent[]>([]);
    const [tick, setTick] = useState(0);
    const nextId = useRef(0);
    const animRef = useRef<number>(0);
    const lastTickRef = useRef(0);
    const tokensRef = useRef(MAX_TOKENS);
    const lastRefillRef = useRef(Date.now());

    useEffect(() => {
        const loop = (timestamp: number) => {
            if (timestamp - lastTickRef.current >= TICK_INTERVAL) {
                lastTickRef.current = timestamp;
                const now = Date.now();
                const elapsed = (now - lastRefillRef.current) / 1000;
                const toAdd = elapsed * REFILL_RATE;
                tokensRef.current = Math.min(MAX_TOKENS, tokensRef.current + toAdd);
                lastRefillRef.current = now;
                setDisplayTokens(tokensRef.current);
                setTick(t => t + 1);
            }
            animRef.current = requestAnimationFrame(loop);
        };
        animRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animRef.current);
    }, []);

    const sendRequest = useCallback(() => {
        const now = Date.now();
        // Refill up to now first
        const elapsed = (now - lastRefillRef.current) / 1000;
        tokensRef.current = Math.min(MAX_TOKENS, tokensRef.current + elapsed * REFILL_RATE);
        lastRefillRef.current = now;

        if (tokensRef.current >= 1) {
            tokensRef.current -= 1;
            setDisplayTokens(tokensRef.current);
            setEvents(prev => [...prev.slice(-20), {
                id: nextId.current++,
                time: now,
                allowed: true,
                tokensAfter: tokensRef.current,
            }]);
        } else {
            setDisplayTokens(tokensRef.current);
            setEvents(prev => [...prev.slice(-20), {
                id: nextId.current++,
                time: now,
                allowed: false,
                tokensAfter: tokensRef.current,
            }]);
        }
    }, []);

    const reset = () => {
        tokensRef.current = MAX_TOKENS;
        lastRefillRef.current = Date.now();
        setDisplayTokens(MAX_TOKENS);
        setEvents([]);
    };

    const fillPercent = (displayTokens / MAX_TOKENS) * 100;
    const totalAllowed = events.filter(e => e.allowed).length;
    const totalRejected = events.filter(e => !e.allowed).length;
    const visibleTokens = Math.floor(displayTokens);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">rate limiting</span>
                <h1>Token Bucket</h1>
                <p className="subtitle">Tokens refill at a fixed rate — each request consumes one token</p>
            </div>

            <div className="stats-row">
                <div className="stat">
                    <span className="stat-label">Tokens Available</span>
                    <span className={`stat-value ${displayTokens < 1 ? 'danger' : 'accent'}`}>
                        {displayTokens.toFixed(2)} / {MAX_TOKENS}
                    </span>
                </div>
                <div className="stat">
                    <span className="stat-label">Refill Rate</span>
                    <span className="stat-value warning">{REFILL_RATE}/s</span>
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
                    <button className="btn btn-accent" onClick={sendRequest}>→ Send Request (−1 token)</button>
                    <button className="btn" onClick={reset}>Reset</button>
                </div>

                <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start' }}>
                    {/* Bucket visualization */}
                    <div style={{ width: 200, flexShrink: 0 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8, textAlign: 'center' }}>
                            bucket
                        </div>
                        <div style={{
                            width: 160,
                            height: 200,
                            margin: '0 auto',
                            background: 'var(--bg)',
                            border: '2px solid var(--border-bright)',
                            borderTop: 'none',
                            borderRadius: '0 0 12px 12px',
                            position: 'relative',
                            overflow: 'hidden',
                        }}>
                            {/* Liquid fill */}
                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: `${fillPercent}%`,
                                background: `linear-gradient(180deg, ${displayTokens < 2 ? 'var(--danger)' : 'var(--accent)'} 0%, ${displayTokens < 2 ? 'var(--danger-dim)' : 'var(--accent-dim)'} 100%)`,
                                opacity: 0.3,
                                transition: 'height 300ms cubic-bezier(0.4, 0, 0.2, 1), background 500ms ease',
                            }} />

                            {/* Token dots */}
                            <div style={{
                                position: 'absolute',
                                bottom: 8,
                                left: 0,
                                right: 0,
                                display: 'flex',
                                flexWrap: 'wrap',
                                justifyContent: 'center',
                                gap: 6,
                                padding: '0 12px',
                            }}>
                                {Array.from({ length: MAX_TOKENS }, (_, i) => (
                                    <div key={i} style={{
                                        width: 20,
                                        height: 20,
                                        borderRadius: '50%',
                                        border: `1.5px solid ${i < visibleTokens ? 'var(--accent)' : 'var(--border)'}`,
                                        background: i < visibleTokens ? 'var(--accent)' : 'transparent',
                                        opacity: i < visibleTokens ? 0.9 : 0.2,
                                        transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: i < visibleTokens ? '0 0 6px var(--accent-glow)' : 'none',
                                    }} />
                                ))}
                            </div>

                            {/* Capacity line */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: -4,
                                right: -4,
                                height: 2,
                                background: 'var(--border-bright)',
                            }} />
                            <span style={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                fontSize: 9,
                                color: 'var(--text-dim)',
                            }}>max: {MAX_TOKENS}</span>
                        </div>

                        {/* Refill indicator */}
                        <div style={{
                            textAlign: 'center',
                            marginTop: 12,
                            fontSize: 11,
                            color: displayTokens < MAX_TOKENS ? 'var(--accent)' : 'var(--text-dim)',
                            animation: displayTokens < MAX_TOKENS ? 'pulse 1.5s ease-in-out infinite' : 'none',
                        }}>
                            {displayTokens < MAX_TOKENS ? `↑ refilling (+${REFILL_RATE}/s)` : '● full'}
                        </div>
                    </div>

                    {/* Right side */}
                    <div style={{ flex: 1 }}>
                        {/* Fill gauge */}
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>Bucket Level</div>
                            <div style={{
                                width: '100%',
                                height: 20,
                                background: 'var(--bg)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius)',
                                overflow: 'hidden',
                            }}>
                                <div style={{
                                    height: '100%',
                                    width: `${fillPercent}%`,
                                    background: displayTokens < 2
                                        ? 'linear-gradient(90deg, var(--danger-dim), var(--danger))'
                                        : 'linear-gradient(90deg, var(--accent-dim), var(--accent))',
                                    transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1), background 500ms ease',
                                    borderRadius: 'var(--radius)',
                                }} />
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>
                                {displayTokens.toFixed(2)} tokens available
                            </div>
                        </div>

                        {/* Event log */}
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>// events</div>
                        <div className="log-area">
                            {events.length === 0 && (
                                <div className="log-entry" style={{ color: 'var(--text-dim)' }}>No requests yet.</div>
                            )}
                            {events.slice(-10).reverse().map(e => (
                                <div key={e.id} className={`log-entry ${e.allowed ? 'allowed' : 'rejected'}`}>
                                    <span className="timestamp">[{new Date(e.time).toISOString().slice(11, 23)}]</span>
                                    {e.allowed ? '✓ −1 token' : '✗ NO TOKENS'} → {e.tokensAfter.toFixed(1)} left
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="info-columns">
                <div className="info-panel">
                    <h3>// how it works</h3>
                    <ul>
                        <li>Bucket starts full with maxTokens</li>
                        <li>Each request consumes 1 token</li>
                        <li>Tokens refill at a constant rate: elapsed × refillRate</li>
                        <li>Refilled tokens capped at bucket capacity</li>
                        <li>If tokens {'<'} 1 → reject the request</li>
                    </ul>
                </div>

                <div className="info-panel">
                    <h3>// trade-offs</h3>
                    <ul>
                        <li>Allows controlled bursting up to bucket capacity</li>
                        <li>Smooth rate limiting over time</li>
                        <li>O(1) time and space</li>
                        <li className="con">Burst at start (bucket starts full)</li>
                        <li className="con">Refill rate tuning can be tricky</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
