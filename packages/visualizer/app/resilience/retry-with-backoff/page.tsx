'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

type AttemptStatus = 'pending' | 'running' | 'success' | 'failure' | 'waiting';
type RunStatus = 'idle' | 'running' | 'success' | 'exhausted';

interface Attempt {
    id: number;
    index: number;
    status: AttemptStatus;
    delay: number;
    startedAt: number;
    finishedAt?: number;
    error?: string;
}

const DEFAULTS = {
    maxRetries: 4,
    baseDelayMs: 500,
    maxDelayMs: 8000,
    jitter: false,
    failureRate: 0.75,
};

export default function RetryWithBackoffPage() {
    const [maxRetries, setMaxRetries] = useState(DEFAULTS.maxRetries);
    const [baseDelay, setBaseDelay] = useState(DEFAULTS.baseDelayMs);
    const [maxDelay, setMaxDelay] = useState(DEFAULTS.maxDelayMs);
    const [jitter, setJitter] = useState(DEFAULTS.jitter);
    const [failureRate, setFailureRate] = useState(DEFAULTS.failureRate);

    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [runStatus, setRunStatus] = useState<RunStatus>('idle');
    const [elapsedMs, setElapsedMs] = useState(0);
    const [totalRuns, setTotalRuns] = useState(0);
    const [totalSuccesses, setTotalSuccesses] = useState(0);
    const [totalExhausted, setTotalExhausted] = useState(0);

    const nextId = useRef(0);
    const cancelRef = useRef(false);
    const runStartRef = useRef(0);
    const animRef = useRef<number>(0);
    const lastTickRef = useRef(0);

    useEffect(() => {
        const TICK_INTERVAL = 80;
        const loop = (timestamp: number) => {
            if (timestamp - lastTickRef.current >= TICK_INTERVAL) {
                lastTickRef.current = timestamp;
                if (runStartRef.current > 0) {
                    setElapsedMs(Date.now() - runStartRef.current);
                }
            }
            animRef.current = requestAnimationFrame(loop);
        };
        animRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animRef.current);
    }, []);

    const calcDelay = useCallback((attempt: number) => {
        let delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        if (jitter) delay = Math.random() * delay;
        return Math.round(delay);
    }, [baseDelay, maxDelay, jitter]);

    const updateAttempt = (id: number, patch: Partial<Attempt>) => {
        setAttempts(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
    };

    const run = useCallback(async () => {
        cancelRef.current = false;
        setAttempts([]);
        setRunStatus('running');
        setElapsedMs(0);
        runStartRef.current = Date.now();
        setTotalRuns(r => r + 1);

        for (let i = 0; i <= maxRetries; i++) {
            if (cancelRef.current) { setRunStatus('idle'); runStartRef.current = 0; return; }

            const delay = i === 0 ? 0 : calcDelay(i - 1);
            const id = nextId.current++;
            const attempt: Attempt = {
                id, index: i,
                status: i === 0 ? 'running' : 'waiting',
                delay, startedAt: Date.now(),
            };

            setAttempts(prev => [...prev, attempt]);

            if (delay > 0) {
                await new Promise(r => setTimeout(r, delay));
                if (cancelRef.current) { setRunStatus('idle'); runStartRef.current = 0; return; }
                updateAttempt(id, { status: 'running' });
            }

            await new Promise(r => setTimeout(r, 300));
            if (cancelRef.current) { setRunStatus('idle'); runStartRef.current = 0; return; }

            const willFail = Math.random() < failureRate;
            if (!willFail) {
                updateAttempt(id, { status: 'success', finishedAt: Date.now() });
                setRunStatus('success');
                setTotalSuccesses(s => s + 1);
                runStartRef.current = 0;
                return;
            }

            updateAttempt(id, { status: 'failure', finishedAt: Date.now(), error: 'Service unavailable' });
        }

        setRunStatus('exhausted');
        setTotalExhausted(e => e + 1);
        runStartRef.current = 0;
    }, [maxRetries, failureRate, calcDelay]);

    const cancel = useCallback(() => {
        cancelRef.current = true;
        setRunStatus('idle');
        runStartRef.current = 0;
    }, []);

    const reset = useCallback(() => {
        cancel();
        setAttempts([]);
        setRunStatus('idle');
        setElapsedMs(0);
        setTotalRuns(0);
        setTotalSuccesses(0);
        setTotalExhausted(0);
    }, [cancel]);

    const schedule = Array.from({ length: maxRetries }, (_, i) =>
        Math.round(Math.min(baseDelay * Math.pow(2, i), maxDelay))
    );

    const statusColor = (s: AttemptStatus) => {
        switch (s) {
            case 'success': return 'var(--accent)';
            case 'failure': return 'var(--danger)';
            case 'running': return 'var(--info)';
            case 'waiting': return 'var(--warning)';
            default: return 'var(--text-dim)';
        }
    };

    const statusIcon = (s: AttemptStatus) => {
        switch (s) {
            case 'success': return '✓';
            case 'failure': return '✗';
            case 'running': return '●';
            case 'waiting': return '◌';
            default: return '·';
        }
    };

    const runStatusColor = runStatus === 'success' ? 'var(--accent)'
        : runStatus === 'exhausted' ? 'var(--danger)'
            : runStatus === 'running' ? 'var(--info)' : 'var(--text-dim)';

    const runStatusLabel = runStatus === 'success' ? 'SUCCEEDED'
        : runStatus === 'exhausted' ? 'EXHAUSTED'
            : runStatus === 'running' ? 'RUNNING' : 'IDLE';

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">resilience</span>
                <h1>Retry with Exponential Backoff</h1>
                <p className="subtitle">Progressively increase wait time between retries — prevent overwhelming a struggling service</p>
            </div>

            {/* Stats Row */}
            <div className="stats-row">
                <div className="stat">
                    <span className="stat-label">Status</span>
                    <span className="stat-value" style={{ color: runStatusColor }}>{runStatusLabel}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Attempt</span>
                    <span className="stat-value">{attempts.length} / {maxRetries + 1}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Elapsed</span>
                    <span className="stat-value warning">{(elapsedMs / 1000).toFixed(1)}s</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Runs</span>
                    <span className="stat-value">{totalRuns}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Successes</span>
                    <span className="stat-value accent">{totalSuccesses}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Exhausted</span>
                    <span className="stat-value danger">{totalExhausted}</span>
                </div>
            </div>

            {/* Main Visualization */}
            <div className="viz-container" style={{ minHeight: 380 }}>
                <div className="viz-controls">
                    <button className="btn btn-accent" onClick={run} disabled={runStatus === 'running'}>
                        ▶ Send Request
                    </button>
                    {runStatus === 'running' && (
                        <button className="btn btn-danger" onClick={cancel}>✕ Cancel</button>
                    )}
                    <button className="btn" onClick={reset}>Reset</button>
                    {runStatus === 'running' && (
                        <span style={{ fontSize: 11, color: 'var(--info)', animation: 'pulse 1s infinite' }}>
                            ● Executing with backoff…
                        </span>
                    )}
                    {runStatus === 'exhausted' && (
                        <span style={{ fontSize: 11, color: 'var(--danger)' }}>⊘ All retries exhausted</span>
                    )}
                    {runStatus === 'success' && (
                        <span style={{ fontSize: 11, color: 'var(--accent)' }}>✓ Request succeeded</span>
                    )}
                </div>

                {/* Attempt Timeline */}
                <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Attempt Timeline
                    </div>

                    {attempts.length === 0 ? (
                        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: 12 }}>
                            Click &quot;Send Request&quot; to start the retry sequence
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {attempts.map((a) => {
                                const barMax = maxDelay + 500;
                                const delayWidth = a.delay > 0 ? Math.max((a.delay / barMax) * 100, 3) : 0;
                                const execWidth = Math.max((300 / barMax) * 100, 3);

                                return (
                                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, animation: 'fadeIn 200ms ease' }}>
                                        <div style={{
                                            width: 70, fontFamily: 'var(--font-mono)', fontSize: 11,
                                            color: statusColor(a.status), flexShrink: 0,
                                        }}>
                                            {statusIcon(a.status)} {a.index === 0 ? 'initial' : `retry ${a.index}`}
                                        </div>

                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2, height: 24 }}>
                                            {a.delay > 0 && (
                                                <div style={{
                                                    width: `${delayWidth}%`, height: '100%',
                                                    background: 'repeating-linear-gradient(90deg, var(--warning) 0px, var(--warning) 3px, transparent 3px, transparent 6px)',
                                                    opacity: 0.4, borderRadius: 'var(--radius)',
                                                    position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    transition: 'width 0.3s ease',
                                                }}>
                                                    <span style={{
                                                        fontSize: 9, color: 'var(--warning)',
                                                        fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', position: 'absolute',
                                                    }}>
                                                        {a.delay}ms
                                                    </span>
                                                </div>
                                            )}

                                            <div style={{
                                                width: `${execWidth}%`, height: '100%',
                                                background: a.status === 'success' ? 'var(--accent)'
                                                    : a.status === 'failure' ? 'var(--danger)'
                                                        : a.status === 'running' ? 'var(--info)' : 'var(--border-bright)',
                                                borderRadius: 'var(--radius)',
                                                opacity: a.status === 'running' ? 0.7 : 0.85,
                                                boxShadow: a.status === 'success' ? '0 0 10px var(--accent-glow)'
                                                    : a.status === 'failure' ? '0 0 10px var(--danger-glow)'
                                                        : a.status === 'running' ? '0 0 10px var(--info-glow)' : 'none',
                                                transition: 'all 0.3s ease',
                                                animation: a.status === 'running' ? 'pulse 1s infinite' : 'none',
                                            }} />
                                        </div>

                                        <div style={{
                                            width: 60, fontFamily: 'var(--font-mono)', fontSize: 10,
                                            color: statusColor(a.status), textAlign: 'right', flexShrink: 0,
                                        }}>
                                            {a.status.toUpperCase()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Backoff Schedule SVG */}
                <div style={{ marginTop: 24 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Backoff Schedule {jitter ? '(with jitter — actual delays vary)' : '(deterministic)'}
                    </div>
                    <svg width="100%" height={30 + maxRetries * 32} viewBox={`0 0 600 ${30 + maxRetries * 32}`} style={{ overflow: 'visible' }}>
                        {schedule.map((delay, i) => {
                            const y = 10 + i * 32;
                            const barWidth = Math.max((delay / maxDelay) * 420, 8);
                            const isActive = attempts.length > 0 && i < attempts.length - 1;

                            return (
                                <g key={i}>
                                    <text x={0} y={y + 16} fill="var(--text-dim)" fontSize={11} fontFamily="var(--font-mono)">
                                        retry {i}
                                    </text>
                                    <rect
                                        x={70} y={y + 2} width={barWidth} height={20} rx={3}
                                        fill={isActive ? 'var(--warning)' : 'var(--accent)'}
                                        opacity={isActive ? 0.8 : 0.35}
                                        style={{
                                            transition: 'all 0.3s ease',
                                            filter: isActive ? 'drop-shadow(0 0 6px var(--warning-glow))' : 'none',
                                        }}
                                    />
                                    <text x={70 + barWidth + 10} y={y + 16}
                                        fill={isActive ? 'var(--warning)' : 'var(--text)'} fontSize={11} fontFamily="var(--font-mono)">
                                        {delay}ms
                                    </text>
                                    <text x={590} y={y + 16} fill="var(--text-dim)" fontSize={9}
                                        fontFamily="var(--font-mono)" textAnchor="end">
                                        {baseDelay}*2^{i} = {baseDelay * Math.pow(2, i)}{baseDelay * Math.pow(2, i) > maxDelay ? ' capped' : ''}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </div>

            {/* Configuration */}
            <div className="viz-container" style={{ minHeight: 'auto' }}>
                <h3 style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                    // configuration
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1 }}>Max Retries</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="range" min={1} max={8} step={1} value={maxRetries}
                                onChange={e => setMaxRetries(Number(e.target.value))} disabled={runStatus === 'running'} style={{ flex: 1 }} />
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--accent)', width: 24, textAlign: 'right' }}>
                                {maxRetries}
                            </span>
                        </div>
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1 }}>Base Delay</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="range" min={100} max={2000} step={100} value={baseDelay}
                                onChange={e => setBaseDelay(Number(e.target.value))} disabled={runStatus === 'running'} style={{ flex: 1 }} />
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--accent)', width: 55, textAlign: 'right' }}>
                                {baseDelay}ms
                            </span>
                        </div>
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1 }}>Max Delay</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="range" min={1000} max={16000} step={1000} value={maxDelay}
                                onChange={e => setMaxDelay(Number(e.target.value))} disabled={runStatus === 'running'} style={{ flex: 1 }} />
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--accent)', width: 62, textAlign: 'right' }}>
                                {maxDelay}ms
                            </span>
                        </div>
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1 }}>Failure Rate</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="range" min={0} max={1} step={0.05} value={failureRate}
                                onChange={e => setFailureRate(Number(e.target.value))} disabled={runStatus === 'running'} style={{ flex: 1 }} />
                            <span style={{
                                fontFamily: 'var(--font-mono)', fontSize: 14, width: 40, textAlign: 'right',
                                color: failureRate > 0.5 ? 'var(--danger)' : 'var(--accent)',
                            }}>
                                {Math.round(failureRate * 100)}%
                            </span>
                        </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 14 }}>
                        <div
                            onClick={() => { if (runStatus !== 'running') setJitter(!jitter); }}
                            style={{
                                width: 36, height: 20, borderRadius: 10,
                                background: jitter ? 'var(--accent)' : 'var(--border-bright)',
                                position: 'relative',
                                cursor: runStatus === 'running' ? 'not-allowed' : 'pointer',
                                transition: 'background 0.2s ease',
                                opacity: runStatus === 'running' ? 0.4 : 1,
                            }}
                        >
                            <div style={{
                                width: 16, height: 16, borderRadius: '50%',
                                background: 'var(--text-bright)', position: 'absolute', top: 2,
                                left: jitter ? 18 : 2, transition: 'left 0.2s ease',
                            }} />
                        </div>
                        <span style={{ fontSize: 11, color: jitter ? 'var(--accent)' : 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                            Jitter {jitter ? 'ON' : 'OFF'}
                        </span>
                    </label>
                </div>
            </div>

            {/* Event Log */}
            <div className="viz-container" style={{ minHeight: 'auto' }}>
                <h3 style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>// event log</h3>
                <div className="log-area">
                    {attempts.length === 0 && (
                        <div className="log-entry" style={{ color: 'var(--text-dim)' }}>
                            No events yet. Click &quot;Send Request&quot; to begin.
                        </div>
                    )}
                    {[...attempts].reverse().map(a => (
                        <div key={a.id} className={`log-entry ${a.status === 'success' ? 'allowed' : a.status === 'failure' ? 'rejected' : ''}`}>
                            <span className="timestamp">[{new Date(a.startedAt).toISOString().slice(11, 23)}]</span>
                            {a.index === 0 ? 'INITIAL' : `RETRY ${a.index}`}
                            {a.delay > 0 ? ` (after ${a.delay}ms)` : ''}
                            {' \u2192 '}
                            {a.status === 'success' && '\u2713 SUCCESS'}
                            {a.status === 'failure' && `\u2717 FAILED: ${a.error}`}
                            {a.status === 'running' && '\u25CF EXECUTING\u2026'}
                            {a.status === 'waiting' && `\u25CC WAITING ${a.delay}ms\u2026`}
                        </div>
                    ))}
                    {runStatus === 'exhausted' && (
                        <div className="log-entry rejected" style={{ fontWeight: 600 }}>
                            <span className="timestamp">[{new Date().toISOString().slice(11, 23)}]</span>
                            \u2298 ALL RETRIES EXHAUSTED \u2014 giving up
                        </div>
                    )}
                </div>
            </div>

            {/* Info Panels */}
            <div className="info-columns">
                <div className="info-panel">
                    <h3>// how it works</h3>
                    <ul>
                        <li>Execute the action. If it succeeds, return immediately.</li>
                        <li>On failure, wait <code style={{ color: 'var(--accent)' }}>baseDelay * 2^attempt</code> before retrying.</li>
                        <li>The delay is capped at <strong>maxDelay</strong> to prevent infinite waits.</li>
                        <li>Optional <strong style={{ color: 'var(--warning)' }}>jitter</strong> randomizes the delay: <code style={{ color: 'var(--warning)' }}>random(0, delay)</code></li>
                        <li>After <strong>maxRetries</strong> failures, give up and throw the last error.</li>
                    </ul>
                </div>

                <div className="info-panel">
                    <h3>// trade-offs</h3>
                    <ul>
                        <li>Handles transient failures gracefully</li>
                        <li>Exponential growth prevents overwhelming the service</li>
                        <li>Jitter prevents thundering herd (synchronized retries)</li>
                        <li className="con">Adds latency to failing requests</li>
                        <li className="con">Not suitable for non-idempotent operations</li>
                        <li className="con">Can mask persistent failures if maxRetries is too high</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
