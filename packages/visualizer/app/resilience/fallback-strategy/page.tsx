'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

/* ── Types ── */

type StrategyStatus = 'idle' | 'running' | 'success' | 'failed';
type FallbackLevel = 'primary' | 'secondary' | 'cache' | 'default';

interface StrategyAttempt {
    id: number;
    level: FallbackLevel;
    label: string;
    status: StrategyStatus;
    startedAt: number;
    elapsed: number;
    finishedAt?: number;
    error?: string;
}

interface FallbackRun {
    id: number;
    attempts: StrategyAttempt[];
    startedAt: number;
    finishedAt?: number;
    totalElapsed: number;
    resolvedBy: FallbackLevel | null;
    outcome: 'success' | 'all-failed' | 'running';
}

interface LogEntry {
    id: number;
    time: number;
    message: string;
    kind: 'info' | 'success' | 'error' | 'fallback' | 'default';
}

interface FallbackConfig {
    label: string;
    level: FallbackLevel;
    enabled: boolean;
    latencyMs: number;
    failureRate: number;
}

const DEFAULT_CHAIN: FallbackConfig[] = [
    { label: 'Primary Service', level: 'primary', enabled: true, latencyMs: 400, failureRate: 0.6 },
    { label: 'Secondary Service', level: 'secondary', enabled: true, latencyMs: 600, failureRate: 0.3 },
    { label: 'Local Cache', level: 'cache', enabled: true, latencyMs: 50, failureRate: 0.05 },
    { label: 'Static Default', level: 'default', enabled: true, latencyMs: 5, failureRate: 0 },
];

/* ── Helpers ── */

const levelColor = (level: FallbackLevel) => {
    switch (level) {
        case 'primary': return 'var(--info)';
        case 'secondary': return 'var(--warning)';
        case 'cache': return 'var(--accent)';
        case 'default': return 'var(--text-dim)';
    }
};

const levelIcon = (level: FallbackLevel) => {
    switch (level) {
        case 'primary': return '●';
        case 'secondary': return '◆';
        case 'cache': return '◎';
        case 'default': return '□';
    }
};

const statusColor = (s: StrategyStatus) => {
    switch (s) {
        case 'running': return 'var(--info)';
        case 'success': return 'var(--accent)';
        case 'failed': return 'var(--danger)';
        default: return 'var(--text-dim)';
    }
};

const statusIcon = (s: StrategyStatus) => {
    switch (s) {
        case 'running': return '●';
        case 'success': return '✓';
        case 'failed': return '✗';
        default: return '◌';
    }
};

/* ── Component ── */

export default function FallbackStrategyPage() {
    const [chain, setChain] = useState<FallbackConfig[]>(DEFAULT_CHAIN.map(c => ({ ...c })));

    const [runs, setRuns] = useState<FallbackRun[]>([]);
    const [currentRun, setCurrentRun] = useState<FallbackRun | null>(null);
    const [log, setLog] = useState<LogEntry[]>([]);

    const [totalRuns, setTotalRuns] = useState(0);
    const [resolvedBy, setResolvedBy] = useState<Record<FallbackLevel, number>>({
        primary: 0, secondary: 0, cache: 0, default: 0,
    });
    const [totalFailed, setTotalFailed] = useState(0);

    const nextId = useRef(0);
    const runIdRef = useRef(0);
    const logIdRef = useRef(0);
    const cancelRef = useRef(false);
    const animRef = useRef<number>(0);
    const lastTickRef = useRef(0);
    const runStartRef = useRef(0);

    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const TICK = 50;
        const loop = (ts: number) => {
            if (ts - lastTickRef.current >= TICK) {
                lastTickRef.current = ts;
                if (runStartRef.current > 0) {
                    setElapsed(Date.now() - runStartRef.current);
                }
            }
            animRef.current = requestAnimationFrame(loop);
        };
        animRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animRef.current);
    }, []);

    const addLog = useCallback((message: string, kind: LogEntry['kind']) => {
        setLog(prev => [{
            id: logIdRef.current++,
            time: Date.now(),
            message,
            kind,
        }, ...prev].slice(0, 60));
    }, []);

    const execute = useCallback(async () => {
        cancelRef.current = false;
        setElapsed(0);
        runStartRef.current = Date.now();
        setTotalRuns(r => r + 1);

        const activeChain = chain.filter(c => c.enabled);
        if (activeChain.length === 0) {
            addLog('⊘ No fallback strategies enabled — nothing to execute', 'error');
            runStartRef.current = 0;
            return;
        }

        const runId = runIdRef.current++;
        const attempts: StrategyAttempt[] = [];

        const run: FallbackRun = {
            id: runId,
            attempts,
            startedAt: Date.now(),
            totalElapsed: 0,
            resolvedBy: null,
            outcome: 'running',
        };

        setCurrentRun({ ...run });

        for (let i = 0; i < activeChain.length; i++) {
            if (cancelRef.current) break;

            const config = activeChain[i];
            const attemptId = nextId.current++;

            const attempt: StrategyAttempt = {
                id: attemptId,
                level: config.level,
                label: config.label,
                status: 'running',
                startedAt: Date.now(),
                elapsed: 0,
            };

            attempts.push(attempt);
            addLog(`${levelIcon(config.level)} Trying ${config.label}…`, i === 0 ? 'info' : 'fallback');
            setCurrentRun({ ...run, attempts: [...attempts] });

            // Simulate latency with jitter
            const jitter = (Math.random() - 0.5) * config.latencyMs * 0.4;
            const actualLatency = Math.max(20, config.latencyMs + jitter);
            await new Promise(r => setTimeout(r, actualLatency));

            if (cancelRef.current) break;

            const willFail = Math.random() < config.failureRate;
            attempt.elapsed = Date.now() - attempt.startedAt;
            attempt.finishedAt = Date.now();

            if (!willFail) {
                attempt.status = 'success';
                run.resolvedBy = config.level;
                run.outcome = 'success';
                run.totalElapsed = Date.now() - run.startedAt;
                run.finishedAt = Date.now();

                addLog(`✓ ${config.label} succeeded in ${attempt.elapsed}ms`, 'success');
                setCurrentRun({ ...run, attempts: [...attempts] });

                // Update stats
                setResolvedBy(prev => ({ ...prev, [config.level]: prev[config.level] + 1 }));
                setRuns(prev => [{ ...run, attempts: [...attempts] }, ...prev].slice(0, 20));
                setCurrentRun(null);
                runStartRef.current = 0;
                return;
            } else {
                attempt.status = 'failed';
                attempt.error = `${config.label} unavailable`;
                addLog(`✗ ${config.label} failed after ${attempt.elapsed}ms`, 'error');
                setCurrentRun({ ...run, attempts: [...attempts] });

                // Small pause before next fallback for visual clarity
                if (i < activeChain.length - 1) {
                    await new Promise(r => setTimeout(r, 150));
                }
            }
        }

        if (!cancelRef.current) {
            run.outcome = 'all-failed';
            run.totalElapsed = Date.now() - run.startedAt;
            run.finishedAt = Date.now();
            addLog('⊘ All fallback strategies exhausted — complete failure', 'error');
            setTotalFailed(f => f + 1);
            setRuns(prev => [{ ...run, attempts: [...attempts] }, ...prev].slice(0, 20));
        }

        setCurrentRun(null);
        runStartRef.current = 0;
    }, [chain, addLog]);

    const cancel = useCallback(() => {
        cancelRef.current = true;
        setCurrentRun(null);
        runStartRef.current = 0;
    }, []);

    const reset = useCallback(() => {
        cancel();
        setRuns([]);
        setLog([]);
        setElapsed(0);
        setTotalRuns(0);
        setResolvedBy({ primary: 0, secondary: 0, cache: 0, default: 0 });
        setTotalFailed(0);
    }, [cancel]);

    const updateChainItem = (index: number, patch: Partial<FallbackConfig>) => {
        setChain(prev => prev.map((c, i) => i === index ? { ...c, ...patch } : c));
    };

    const isRunning = currentRun !== null;
    const displayAttempts = currentRun?.attempts ??
        (runs.length > 0 ? runs[0].attempts : []);

    const totalResolved = Object.values(resolvedBy).reduce((a, b) => a + b, 0);

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">resilience</span>
                <h1>Fallback Strategy</h1>
                <p className="subtitle">
                    Chain alternative providers — gracefully degrade through progressively simpler responses
                </p>
            </div>

            {/* Stats Row */}
            <div className="stats-row">
                <div className="stat">
                    <span className="stat-label">Status</span>
                    <span className="stat-value" style={{
                        color: isRunning ? 'var(--info)'
                            : runs.length > 0
                                ? runs[0].outcome === 'success' ? 'var(--accent)' : 'var(--danger)'
                                : 'var(--text-dim)',
                    }}>
                        {isRunning ? 'EXECUTING' : runs.length > 0
                            ? runs[0].outcome === 'success' ? 'RESOLVED' : 'ALL FAILED'
                            : 'IDLE'}
                    </span>
                </div>
                <div className="stat">
                    <span className="stat-label">Elapsed</span>
                    <span className="stat-value" style={{ color: 'var(--info)' }}>
                        {isRunning ? `${(elapsed / 1000).toFixed(1)}s`
                            : runs.length > 0 ? `${(runs[0].totalElapsed / 1000).toFixed(1)}s` : '0.0s'}
                    </span>
                </div>
                <div className="stat">
                    <span className="stat-label">Runs</span>
                    <span className="stat-value">{totalRuns}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Resolved</span>
                    <span className="stat-value accent">{totalResolved}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">All Failed</span>
                    <span className="stat-value danger">{totalFailed}</span>
                </div>
            </div>

            {/* Main Visualization */}
            <div className="viz-container" style={{ minHeight: 400 }}>
                <div className="viz-controls">
                    <button className="btn btn-accent" onClick={execute} disabled={isRunning}>
                        ▶ Execute Request
                    </button>
                    {isRunning && (
                        <button className="btn btn-danger" onClick={cancel}>✕ Cancel</button>
                    )}
                    <button className="btn" onClick={reset}>Reset</button>
                    {isRunning && (
                        <span style={{ fontSize: 11, color: 'var(--info)', animation: 'pulse 1s infinite' }}>
                            ● Walking fallback chain…
                        </span>
                    )}
                </div>

                {/* Fallback Chain Diagram */}
                <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Fallback Chain
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
                        {chain.filter(c => c.enabled).map((config, i, arr) => {
                            const attempt = displayAttempts.find(a => a.level === config.level);
                            const isActive = attempt?.status === 'running';
                            const succeeded = attempt?.status === 'success';
                            const failed = attempt?.status === 'failed';
                            const isPending = !attempt;
                            const isLast = i === arr.length - 1;

                            return (
                                <div key={config.level}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        padding: '12px 16px',
                                        background: isActive ? 'rgba(68,136,255,0.06)'
                                            : succeeded ? 'rgba(0,255,136,0.06)'
                                                : failed ? 'rgba(255,68,68,0.04)'
                                                    : 'var(--surface-2)',
                                        border: `1px solid ${isActive ? 'var(--info)'
                                            : succeeded ? 'var(--accent)'
                                                : failed ? 'var(--danger)'
                                                    : 'var(--border)'}`,
                                        borderRadius: 'var(--radius)',
                                        transition: 'all 300ms ease',
                                        animation: isActive ? 'pulse 1s infinite' : 'none',
                                        boxShadow: isActive ? '0 0 16px var(--info-glow)'
                                            : succeeded ? '0 0 16px var(--accent-glow)' : 'none',
                                    }}>
                                        {/* Level indicator */}
                                        <div style={{
                                            width: 36, height: 36,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 16,
                                            fontWeight: 600,
                                            background: isActive ? 'var(--info-glow)'
                                                : succeeded ? 'var(--accent-glow)'
                                                    : failed ? 'var(--danger-glow)'
                                                        : 'var(--surface)',
                                            border: `2px solid ${isActive ? 'var(--info)'
                                                : succeeded ? 'var(--accent)'
                                                    : failed ? 'var(--danger)'
                                                        : 'var(--border-bright)'}`,
                                            color: isActive ? 'var(--info)'
                                                : succeeded ? 'var(--accent)'
                                                    : failed ? 'var(--danger)'
                                                        : 'var(--text-dim)',
                                            transition: 'all 300ms ease',
                                            flexShrink: 0,
                                        }}>
                                            {attempt ? statusIcon(attempt.status) : levelIcon(config.level)}
                                        </div>

                                        {/* Label & info */}
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                fontFamily: 'var(--font-mono)',
                                                fontSize: 13,
                                                fontWeight: 600,
                                                color: isActive ? 'var(--info)'
                                                    : succeeded ? 'var(--accent)'
                                                        : failed ? 'var(--danger)'
                                                            : isPending && displayAttempts.length > 0 ? 'var(--text-dim)' : 'var(--text-bright)',
                                            }}>
                                                {config.label}
                                            </div>
                                            <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                                                ~{config.latencyMs}ms latency · {Math.round(config.failureRate * 100)}% failure rate
                                            </div>
                                        </div>

                                        {/* Status badge */}
                                        <div style={{
                                            fontFamily: 'var(--font-mono)',
                                            fontSize: 10,
                                            padding: '2px 8px',
                                            borderRadius: 10,
                                            background: isActive ? 'var(--info-glow)'
                                                : succeeded ? 'var(--accent-glow)'
                                                    : failed ? 'var(--danger-glow)'
                                                        : 'transparent',
                                            color: isActive ? 'var(--info)'
                                                : succeeded ? 'var(--accent)'
                                                    : failed ? 'var(--danger)'
                                                        : 'var(--text-dim)',
                                            textTransform: 'uppercase',
                                            border: `1px solid ${isActive ? 'var(--info)'
                                                : succeeded ? 'var(--accent)'
                                                    : failed ? 'var(--danger)'
                                                        : 'transparent'}`,
                                        }}>
                                            {isActive ? 'executing…' : succeeded ? 'resolved' : failed ? `failed ${attempt?.elapsed}ms` : 'standby'}
                                        </div>
                                    </div>

                                    {/* Connector arrow */}
                                    {!isLast && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            height: 28,
                                            position: 'relative',
                                        }}>
                                            <div style={{
                                                width: 2,
                                                height: '100%',
                                                background: failed ? 'var(--danger)' : 'var(--border-bright)',
                                                transition: 'background 300ms ease',
                                            }} />
                                            {failed && (
                                                <span style={{
                                                    position: 'absolute',
                                                    left: '50%',
                                                    transform: 'translateX(-50%)',
                                                    fontSize: 9,
                                                    color: 'var(--danger)',
                                                    fontFamily: 'var(--font-mono)',
                                                    background: 'var(--bg)',
                                                    padding: '0 6px',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    ↓ fallback
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Result indicator */}
                {!isRunning && runs.length > 0 && runs[0].outcome === 'success' && (
                    <div style={{
                        padding: '12px 16px',
                        borderRadius: 'var(--radius)',
                        background: 'rgba(0,255,136,0.06)',
                        border: '1px solid var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        marginTop: 16,
                        animation: 'fadeIn 300ms ease',
                    }}>
                        <span style={{ fontSize: 20, color: 'var(--accent)' }}>✓</span>
                        <div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
                                Resolved by {chain.find(c => c.level === runs[0].resolvedBy)?.label ?? runs[0].resolvedBy}
                                {runs[0].resolvedBy !== 'primary' ? ' (fallback)' : ' (first try)'}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                                Total elapsed: {runs[0].totalElapsed}ms ·
                                Tried {runs[0].attempts.length} of {chain.filter(c => c.enabled).length} strategies
                            </div>
                        </div>
                    </div>
                )}

                {!isRunning && runs.length > 0 && runs[0].outcome === 'all-failed' && (
                    <div style={{
                        padding: '12px 16px',
                        borderRadius: 'var(--radius)',
                        background: 'rgba(255,68,68,0.06)',
                        border: '1px solid var(--danger)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        marginTop: 16,
                        animation: 'fadeIn 300ms ease',
                    }}>
                        <span style={{ fontSize: 20, color: 'var(--danger)' }}>✗</span>
                        <div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--danger)', fontWeight: 600 }}>
                                Complete failure — all fallback strategies exhausted
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                                Tried all {runs[0].attempts.length} strategies in {runs[0].totalElapsed}ms
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Resolution Distribution */}
            {totalResolved > 0 && (
                <div className="viz-container" style={{ minHeight: 'auto' }}>
                    <h3 style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                        // resolution distribution
                    </h3>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {chain.filter(c => c.enabled).map(config => {
                            const count = resolvedBy[config.level];
                            const pct = totalResolved > 0 ? (count / totalResolved) * 100 : 0;
                            return (
                                <div key={config.level} style={{
                                    flex: '1 1 140px',
                                    padding: '10px 14px',
                                    background: 'var(--surface-2)',
                                    borderRadius: 'var(--radius)',
                                    border: `1px solid ${count > 0 ? levelColor(config.level) : 'var(--border)'}`,
                                }}>
                                    <div style={{
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: 10,
                                        color: levelColor(config.level),
                                        textTransform: 'uppercase',
                                        marginBottom: 6,
                                    }}>
                                        {levelIcon(config.level)} {config.label}
                                    </div>
                                    <div style={{
                                        height: 6,
                                        background: 'var(--surface)',
                                        borderRadius: 3,
                                        overflow: 'hidden',
                                        marginBottom: 4,
                                    }}>
                                        <div style={{
                                            width: `${pct}%`,
                                            height: '100%',
                                            background: levelColor(config.level),
                                            borderRadius: 3,
                                            transition: 'width 300ms ease',
                                        }} />
                                    </div>
                                    <div style={{
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: 11,
                                        color: count > 0 ? levelColor(config.level) : 'var(--text-dim)',
                                    }}>
                                        {count} ({Math.round(pct)}%)
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Configuration */}
            <div className="viz-container" style={{ minHeight: 'auto' }}>
                <h3 style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                    // fallback chain configuration
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {chain.map((config, i) => (
                        <div key={config.level} style={{
                            padding: '12px 16px',
                            background: config.enabled ? 'var(--surface-2)' : 'var(--surface)',
                            borderRadius: 'var(--radius)',
                            border: `1px solid ${config.enabled ? 'var(--border-bright)' : 'var(--border)'}`,
                            opacity: config.enabled ? 1 : 0.5,
                            transition: 'all 200ms ease',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                {/* Enable toggle */}
                                <div
                                    onClick={() => { if (!isRunning) updateChainItem(i, { enabled: !config.enabled }); }}
                                    style={{
                                        width: 36, height: 20, borderRadius: 10,
                                        background: config.enabled ? levelColor(config.level) : 'var(--border-bright)',
                                        position: 'relative',
                                        cursor: isRunning ? 'not-allowed' : 'pointer',
                                        transition: 'background 0.2s ease',
                                        flexShrink: 0,
                                    }}
                                >
                                    <div style={{
                                        width: 16, height: 16, borderRadius: '50%',
                                        background: 'var(--text-bright)', position: 'absolute', top: 2,
                                        left: config.enabled ? 18 : 2, transition: 'left 0.2s ease',
                                    }} />
                                </div>
                                <span style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: config.enabled ? levelColor(config.level) : 'var(--text-dim)',
                                }}>
                                    {levelIcon(config.level)} {config.label}
                                </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <span style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1 }}>Latency</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <input type="range" min={5} max={2000} step={25} value={config.latencyMs}
                                            onChange={e => updateChainItem(i, { latencyMs: Number(e.target.value) })}
                                            disabled={isRunning || !config.enabled} style={{ flex: 1 }} />
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: levelColor(config.level), width: 50, textAlign: 'right' }}>
                                            {config.latencyMs}ms
                                        </span>
                                    </div>
                                </label>

                                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <span style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1 }}>Failure Rate</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <input type="range" min={0} max={1} step={0.05} value={config.failureRate}
                                            onChange={e => updateChainItem(i, { failureRate: Number(e.target.value) })}
                                            disabled={isRunning || !config.enabled} style={{ flex: 1 }} />
                                        <span style={{
                                            fontFamily: 'var(--font-mono)', fontSize: 12, width: 38, textAlign: 'right',
                                            color: config.failureRate > 0.5 ? 'var(--danger)' : levelColor(config.level),
                                        }}>
                                            {Math.round(config.failureRate * 100)}%
                                        </span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Presets */}
                <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-dim)', alignSelf: 'center', marginRight: 4 }}>PRESETS:</span>
                    <button className="btn" disabled={isRunning} onClick={() => setChain(DEFAULT_CHAIN.map(c => ({ ...c })))}
                        style={{ fontSize: 10, padding: '4px 10px' }}>
                        ✓ Default
                    </button>
                    <button className="btn" disabled={isRunning} onClick={() => setChain([
                        { label: 'Primary Service', level: 'primary', enabled: true, latencyMs: 400, failureRate: 0.1 },
                        { label: 'Secondary Service', level: 'secondary', enabled: true, latencyMs: 600, failureRate: 0.1 },
                        { label: 'Local Cache', level: 'cache', enabled: true, latencyMs: 50, failureRate: 0.05 },
                        { label: 'Static Default', level: 'default', enabled: true, latencyMs: 5, failureRate: 0 },
                    ])}
                        style={{ fontSize: 10, padding: '4px 10px' }}>
                        ✓ Healthy Services
                    </button>
                    <button className="btn" disabled={isRunning} onClick={() => setChain([
                        { label: 'Primary Service', level: 'primary', enabled: true, latencyMs: 400, failureRate: 0.95 },
                        { label: 'Secondary Service', level: 'secondary', enabled: true, latencyMs: 600, failureRate: 0.8 },
                        { label: 'Local Cache', level: 'cache', enabled: true, latencyMs: 50, failureRate: 0.1 },
                        { label: 'Static Default', level: 'default', enabled: true, latencyMs: 5, failureRate: 0 },
                    ])}
                        style={{ fontSize: 10, padding: '4px 10px' }}>
                        💥 Major Outage
                    </button>
                    <button className="btn" disabled={isRunning} onClick={() => setChain([
                        { label: 'Primary Service', level: 'primary', enabled: true, latencyMs: 400, failureRate: 1.0 },
                        { label: 'Secondary Service', level: 'secondary', enabled: true, latencyMs: 600, failureRate: 1.0 },
                        { label: 'Local Cache', level: 'cache', enabled: true, latencyMs: 50, failureRate: 1.0 },
                        { label: 'Static Default', level: 'default', enabled: true, latencyMs: 5, failureRate: 1.0 },
                    ])}
                        style={{ fontSize: 10, padding: '4px 10px' }}>
                        🔥 Total Failure
                    </button>
                    <button className="btn" disabled={isRunning} onClick={() => setChain([
                        { label: 'Primary Service', level: 'primary', enabled: true, latencyMs: 400, failureRate: 0.8 },
                        { label: 'Secondary Service', level: 'secondary', enabled: false, latencyMs: 600, failureRate: 0.3 },
                        { label: 'Local Cache', level: 'cache', enabled: false, latencyMs: 50, failureRate: 0.05 },
                        { label: 'Static Default', level: 'default', enabled: true, latencyMs: 5, failureRate: 0 },
                    ])}
                        style={{ fontSize: 10, padding: '4px 10px' }}>
                        🔒 Minimal (2 levels)
                    </button>
                </div>
            </div>

            {/* Event Log */}
            <div className="viz-container" style={{ minHeight: 'auto' }}>
                <h3 style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>// event log</h3>
                <div className="log-area">
                    {log.length === 0 && (
                        <div className="log-entry" style={{ color: 'var(--text-dim)' }}>
                            No events yet. Click &quot;Execute Request&quot; to begin.
                        </div>
                    )}
                    {log.map(entry => (
                        <div
                            key={entry.id}
                            className={`log-entry ${entry.kind === 'success' ? 'allowed' : entry.kind === 'error' ? 'rejected' : ''}`}
                            style={{
                                color: entry.kind === 'fallback' ? 'var(--warning)'
                                    : entry.kind === 'default' ? 'var(--text-dim)' : undefined,
                            }}
                        >
                            <span className="timestamp">[{new Date(entry.time).toISOString().slice(11, 23)}]</span>
                            {entry.message}
                        </div>
                    ))}
                </div>
            </div>

            {/* Info Panels */}
            <div className="info-columns">
                <div className="info-panel">
                    <h3>// how it works</h3>
                    <ul>
                        <li>Define a <strong>chain of fallback strategies</strong> in priority order.</li>
                        <li>Try the <strong style={{ color: 'var(--info)' }}>primary service</strong> first.</li>
                        <li>If it fails, try the <strong style={{ color: 'var(--warning)' }}>secondary service</strong>.</li>
                        <li>If that fails, try a <strong style={{ color: 'var(--accent)' }}>local cache</strong> for stale data.</li>
                        <li>Last resort: return a <strong>static default</strong> value.</li>
                        <li>Each level degrades gracefully — the user always gets <em>something</em>.</li>
                    </ul>
                </div>

                <div className="info-panel">
                    <h3>// trade-offs</h3>
                    <ul>
                        <li>Users always get a response, even during outages</li>
                        <li>Graceful degradation instead of hard failure</li>
                        <li>Flexible — add/remove strategies per use case</li>
                        <li className="con">Stale data from cache may confuse users</li>
                        <li className="con">Default values may not be meaningful for all endpoints</li>
                        <li className="con">Adds latency on failure (serial fallback chain)</li>
                        <li className="con">Complexity grows with more fallback levels</li>
                    </ul>
                </div>

                <div className="info-panel">
                    <h3>// real-world usage</h3>
                    <ul>
                        <li>Netflix: fallback to cached recommendations when personalization fails</li>
                        <li>E-commerce: show cached product data when catalog service is down</li>
                        <li>CDN: origin → edge cache → stale-while-revalidate</li>
                        <li>API Gateway: primary → secondary region → static maintenance page</li>
                        <li>Composition: <code style={{ color: 'var(--accent)' }}>circuit-breaker → fallback → cache</code></li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
