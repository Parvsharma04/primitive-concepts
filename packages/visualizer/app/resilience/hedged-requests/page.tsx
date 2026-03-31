'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

/* ── Types ── */

type RequestStatus = 'pending' | 'running' | 'success' | 'cancelled' | 'error' | 'timed-out';

interface HedgedRequest {
    id: number;
    index: number; // 0 = primary, 1+ = hedge
    status: RequestStatus;
    startedAt: number;
    elapsed: number;
    latencyMs: number;
    finishedAt?: number;
    winner: boolean;
}

interface Round {
    id: number;
    requests: HedgedRequest[];
    hedgeDelayMs: number;
    startedAt: number;
    finishedAt?: number;
    winnerIndex: number | null;
    outcome: 'success' | 'all-failed' | 'running';
    totalElapsed: number;
}

interface LogEntry {
    id: number;
    time: number;
    message: string;
    kind: 'info' | 'success' | 'error' | 'cancelled' | 'hedge';
}

const DEFAULTS = {
    hedgeDelayMs: 500,
    maxHedges: 2,
    baseLatencyMs: 800,
    latencyVariance: 1.5,
    failureRate: 0.15,
    timeoutMs: 3000,
};

/* ── Helpers ── */

const statusColor = (s: RequestStatus) => {
    switch (s) {
        case 'running': return 'var(--info)';
        case 'success': return 'var(--accent)';
        case 'cancelled': return 'var(--text-dim)';
        case 'error': return 'var(--danger)';
        case 'timed-out': return 'var(--warning)';
        default: return 'var(--text-dim)';
    }
};

const statusIcon = (s: RequestStatus) => {
    switch (s) {
        case 'running': return '●';
        case 'success': return '✓';
        case 'cancelled': return '⊘';
        case 'error': return '✗';
        case 'timed-out': return '⏱';
        default: return '◌';
    }
};

/* ── Component ── */

export default function HedgedRequestsPage() {
    const [hedgeDelay, setHedgeDelay] = useState(DEFAULTS.hedgeDelayMs);
    const [maxHedges, setMaxHedges] = useState(DEFAULTS.maxHedges);
    const [baseLatency, setBaseLatency] = useState(DEFAULTS.baseLatencyMs);
    const [latencyVariance, setLatencyVariance] = useState(DEFAULTS.latencyVariance);
    const [failureRate, setFailureRate] = useState(DEFAULTS.failureRate);
    const [timeoutMs, setTimeoutMs] = useState(DEFAULTS.timeoutMs);

    const [rounds, setRounds] = useState<Round[]>([]);
    const [currentRound, setCurrentRound] = useState<Round | null>(null);
    const [log, setLog] = useState<LogEntry[]>([]);

    const [totalRounds, setTotalRounds] = useState(0);
    const [totalSuccess, setTotalSuccess] = useState(0);
    const [totalFailed, setTotalFailed] = useState(0);
    const [savedLatency, setSavedLatency] = useState(0);

    const nextId = useRef(0);
    const roundIdRef = useRef(0);
    const logIdRef = useRef(0);
    const cancelRef = useRef(false);
    const animRef = useRef<number>(0);
    const lastTickRef = useRef(0);
    const roundStartRef = useRef(0);

    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const TICK = 50;
        const loop = (ts: number) => {
            if (ts - lastTickRef.current >= TICK) {
                lastTickRef.current = ts;
                if (roundStartRef.current > 0) {
                    setElapsed(Date.now() - roundStartRef.current);
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

    const genLatency = useCallback(() => {
        // Log-normal-ish distribution for realistic tail latency
        const mult = 1 + (Math.random() * (latencyVariance - 1));
        const isTail = Math.random() < 0.2; // 20% chance of tail latency
        const tailMult = isTail ? (1.5 + Math.random() * 2) : 1;
        return Math.round(baseLatency * mult * tailMult);
    }, [baseLatency, latencyVariance]);

    const execute = useCallback(async () => {
        cancelRef.current = false;
        setElapsed(0);
        roundStartRef.current = Date.now();
        setTotalRounds(r => r + 1);

        const roundId = roundIdRef.current++;
        const totalRequests = 1 + maxHedges; // primary + hedges
        const requests: HedgedRequest[] = [];
        const resolvers: Array<{ resolve: (val: 'success' | 'error') => void }> = [];

        // Create all requests with their latencies
        for (let i = 0; i < totalRequests; i++) {
            const latency = genLatency();
            requests.push({
                id: nextId.current++,
                index: i,
                status: 'pending',
                startedAt: 0,
                elapsed: 0,
                latencyMs: latency,
                winner: false,
            });
        }

        const round: Round = {
            id: roundId,
            requests: [...requests],
            hedgeDelayMs: hedgeDelay,
            startedAt: Date.now(),
            winnerIndex: null,
            outcome: 'running',
            totalElapsed: 0,
        };

        setCurrentRound({ ...round });

        let winnerFound = false;
        let completedCount = 0;

        const updateRound = (reqs: HedgedRequest[], winIdx: number | null, outcome: Round['outcome']) => {
            const r: Round = {
                ...round,
                requests: [...reqs],
                winnerIndex: winIdx,
                outcome,
                totalElapsed: Date.now() - round.startedAt,
            };
            setCurrentRound({ ...r });
            return r;
        };

        // Start primary request
        requests[0] = { ...requests[0], status: 'running', startedAt: Date.now() };
        addLog(`● Primary request #${requests[0].id} started (latency ~${requests[0].latencyMs}ms)`, 'info');
        updateRound(requests, null, 'running');

        const racePromise = new Promise<Round>((resolveRace) => {
            // Schedule each request's completion
            const timers: NodeJS.Timeout[] = [];

            const finishRequest = (idx: number, willFail: boolean) => {
                if (cancelRef.current) return;
                if (requests[idx].status !== 'running') return;

                const now = Date.now();
                requests[idx] = {
                    ...requests[idx],
                    elapsed: now - requests[idx].startedAt,
                    finishedAt: now,
                    status: willFail ? 'error' : 'success',
                };

                if (!willFail && !winnerFound) {
                    winnerFound = true;
                    requests[idx].winner = true;

                    // Cancel all other running requests
                    for (let j = 0; j < requests.length; j++) {
                        if (j !== idx && (requests[j].status === 'running' || requests[j].status === 'pending')) {
                            requests[j] = {
                                ...requests[j],
                                status: 'cancelled',
                                elapsed: requests[j].startedAt > 0 ? now - requests[j].startedAt : 0,
                                finishedAt: now,
                            };
                            addLog(`⊘ ${j === 0 ? 'Primary' : `Hedge #${j}`} cancelled — winner found`, 'cancelled');
                        }
                    }

                    addLog(`✓ ${idx === 0 ? 'Primary' : `Hedge #${idx}`} won in ${requests[idx].elapsed}ms!`, 'success');
                    timers.forEach(t => clearTimeout(t));
                    resolveRace(updateRound(requests, idx, 'success'));
                    return;
                }

                if (willFail) {
                    addLog(`✗ ${idx === 0 ? 'Primary' : `Hedge #${idx}`} failed after ${requests[idx].elapsed}ms`, 'error');
                }

                completedCount++;
                updateRound(requests, null, 'running');

                // Check if all requests completed without success
                if (completedCount >= requests.filter(r => r.status !== 'pending').length &&
                    !requests.some(r => r.status === 'pending') && !winnerFound) {
                    resolveRace(updateRound(requests, null, 'all-failed'));
                }
            };

            // Schedule primary
            const primaryFail = Math.random() < failureRate;
            const primaryLatency = Math.min(requests[0].latencyMs, timeoutMs);
            timers.push(setTimeout(() => finishRequest(0, primaryFail), primaryLatency));

            // Schedule hedges
            for (let h = 1; h <= maxHedges; h++) {
                const delay = hedgeDelay * h;
                const hedgeIdx = h;

                timers.push(setTimeout(() => {
                    if (cancelRef.current || winnerFound) return;
                    if (requests[hedgeIdx].status !== 'pending') return;

                    requests[hedgeIdx] = { ...requests[hedgeIdx], status: 'running', startedAt: Date.now() };
                    addLog(`◆ Hedge #${hedgeIdx} launched after ${delay}ms wait (latency ~${requests[hedgeIdx].latencyMs}ms)`, 'hedge');
                    updateRound(requests, null, 'running');

                    const hedgeFail = Math.random() < failureRate;
                    const hedgeLatency = Math.min(requests[hedgeIdx].latencyMs, timeoutMs - delay);

                    timers.push(setTimeout(() => finishRequest(hedgeIdx, hedgeFail), Math.max(hedgeLatency, 50)));
                }, delay));
            }

            // Global timeout
            timers.push(setTimeout(() => {
                if (cancelRef.current || winnerFound) return;
                for (let j = 0; j < requests.length; j++) {
                    if (requests[j].status === 'running' || requests[j].status === 'pending') {
                        requests[j] = {
                            ...requests[j],
                            status: 'timed-out',
                            elapsed: requests[j].startedAt > 0 ? Date.now() - requests[j].startedAt : 0,
                            finishedAt: Date.now(),
                        };
                    }
                }
                addLog(`⏱ Global timeout (${timeoutMs}ms) — all remaining requests aborted`, 'error');
                resolveRace(updateRound(requests, null, 'all-failed'));
            }, timeoutMs));
        });

        const finalRound = await racePromise;
        roundStartRef.current = 0;

        if (!cancelRef.current) {
            if (finalRound.outcome === 'success') {
                setTotalSuccess(s => s + 1);
                // Calculate latency savings
                const winnerElapsed = finalRound.requests.find(r => r.winner)?.elapsed ?? 0;
                const primaryLatency = finalRound.requests[0].latencyMs;
                if (winnerElapsed < primaryLatency) {
                    setSavedLatency(prev => prev + (primaryLatency - winnerElapsed));
                }
            } else {
                setTotalFailed(f => f + 1);
            }
            setRounds(prev => [finalRound, ...prev].slice(0, 20));
            setCurrentRound(null);
        }
    }, [hedgeDelay, maxHedges, baseLatency, failureRate, timeoutMs, genLatency, addLog]);

    const cancel = useCallback(() => {
        cancelRef.current = true;
        setCurrentRound(null);
        roundStartRef.current = 0;
    }, []);

    const reset = useCallback(() => {
        cancel();
        setRounds([]);
        setLog([]);
        setElapsed(0);
        setTotalRounds(0);
        setTotalSuccess(0);
        setTotalFailed(0);
        setSavedLatency(0);
    }, [cancel]);

    const isRunning = currentRound !== null;

    const displayRequests = currentRound?.requests ??
        (rounds.length > 0 ? rounds[0].requests : []);

    const barMax = timeoutMs * 1.1;

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">resilience</span>
                <h1>Hedged Requests</h1>
                <p className="subtitle">
                    Fire duplicate requests after a delay — use whichever responds first to tame tail latency
                </p>
            </div>

            {/* Stats Row */}
            <div className="stats-row">
                <div className="stat">
                    <span className="stat-label">Status</span>
                    <span className="stat-value" style={{
                        color: isRunning ? 'var(--info)'
                            : rounds.length > 0
                                ? rounds[0].outcome === 'success' ? 'var(--accent)' : 'var(--danger)'
                                : 'var(--text-dim)',
                    }}>
                        {isRunning ? 'RACING' : rounds.length > 0
                            ? rounds[0].outcome === 'success' ? 'SUCCEEDED' : 'ALL FAILED'
                            : 'IDLE'}
                    </span>
                </div>
                <div className="stat">
                    <span className="stat-label">Elapsed</span>
                    <span className="stat-value" style={{ color: isRunning && elapsed > timeoutMs ? 'var(--danger)' : 'var(--info)' }}>
                        {isRunning ? `${(elapsed / 1000).toFixed(1)}s`
                            : rounds.length > 0 ? `${(rounds[0].totalElapsed / 1000).toFixed(1)}s` : '0.0s'}
                    </span>
                </div>
                <div className="stat">
                    <span className="stat-label">Rounds</span>
                    <span className="stat-value">{totalRounds}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Successes</span>
                    <span className="stat-value accent">{totalSuccess}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Failures</span>
                    <span className="stat-value danger">{totalFailed}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Latency Saved</span>
                    <span className="stat-value" style={{ color: 'var(--accent)' }}>{savedLatency}ms</span>
                </div>
            </div>

            {/* Main Visualization */}
            <div className="viz-container" style={{ minHeight: 380 }}>
                <div className="viz-controls">
                    <button className="btn btn-accent" onClick={execute} disabled={isRunning}>
                        ▶ Send Request
                    </button>
                    {isRunning && (
                        <button className="btn btn-danger" onClick={cancel}>✕ Cancel</button>
                    )}
                    <button className="btn" onClick={reset}>Reset</button>
                    {isRunning && (
                        <span style={{ fontSize: 11, color: 'var(--info)', animation: 'pulse 1s infinite' }}>
                            ● Racing {1 + maxHedges} requests…
                        </span>
                    )}
                </div>

                {/* Race Lanes Visualization */}
                <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Request Race Lanes
                    </div>

                    {displayRequests.length === 0 ? (
                        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: 12 }}>
                            Click &quot;Send Request&quot; to launch a hedged request
                        </div>
                    ) : (
                        <div style={{ position: 'relative' }}>
                            {/* Timeout deadline marker */}
                            <div style={{
                                position: 'absolute',
                                left: `calc(90px + ${(timeoutMs / barMax) * 100}% * 0.75)`,
                                top: -8,
                                bottom: -8,
                                width: 2,
                                background: 'var(--danger)',
                                opacity: 0.5,
                                zIndex: 1,
                            }}>
                                <span style={{
                                    position: 'absolute',
                                    top: -16,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    fontSize: 8,
                                    color: 'var(--danger)',
                                    fontFamily: 'var(--font-mono)',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {timeoutMs}ms timeout
                                </span>
                            </div>

                            {/* Hedge delay markers */}
                            {Array.from({ length: maxHedges }, (_, i) => {
                                const delay = hedgeDelay * (i + 1);
                                return (
                                    <div key={i} style={{
                                        position: 'absolute',
                                        left: `calc(90px + ${(delay / barMax) * 100}% * 0.75)`,
                                        top: -4,
                                        bottom: -4,
                                        width: 1,
                                        background: 'var(--warning)',
                                        opacity: 0.3,
                                        zIndex: 1,
                                        borderStyle: 'dashed',
                                    }}>
                                        <span style={{
                                            position: 'absolute',
                                            bottom: -14,
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            fontSize: 7,
                                            color: 'var(--warning)',
                                            fontFamily: 'var(--font-mono)',
                                            whiteSpace: 'nowrap',
                                            opacity: 0.7,
                                        }}>
                                            hedge @{delay}ms
                                        </span>
                                    </div>
                                );
                            })}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 16 }}>
                                {displayRequests.map((req) => {
                                    const barWidth = req.status === 'pending' ? 0
                                        : req.status === 'running'
                                            ? Math.min(((Date.now() - req.startedAt) / barMax) * 100, 100)
                                            : Math.min((req.elapsed / barMax) * 100, 100);

                                    return (
                                        <div key={req.id} style={{
                                            display: 'flex', alignItems: 'center', gap: 10,
                                            animation: 'fadeIn 200ms ease',
                                        }}>
                                            <div style={{
                                                width: 80, fontFamily: 'var(--font-mono)', fontSize: 11,
                                                color: req.winner ? 'var(--accent)' : statusColor(req.status),
                                                flexShrink: 0,
                                            }}>
                                                {statusIcon(req.status)} {req.index === 0 ? 'primary' : `hedge #${req.index}`}
                                            </div>

                                            <div style={{
                                                flex: 1, position: 'relative', height: 32,
                                                background: 'var(--surface-2)',
                                                borderRadius: 'var(--radius)',
                                                overflow: 'hidden',
                                                border: req.winner ? '1px solid var(--accent)' : '1px solid var(--border)',
                                            }}>
                                                <div style={{
                                                    position: 'absolute',
                                                    top: 0, left: 0, bottom: 0,
                                                    width: `${barWidth}%`,
                                                    background: req.winner
                                                        ? 'var(--accent)'
                                                        : req.status === 'error' || req.status === 'timed-out'
                                                            ? 'var(--danger)'
                                                            : req.status === 'cancelled'
                                                                ? 'var(--text-dim)'
                                                                : 'var(--info)',
                                                    opacity: req.winner ? 0.5 : 0.3,
                                                    borderRadius: 'var(--radius)',
                                                    transition: req.status === 'running' ? 'width 0.1s linear' : 'width 0.3s ease',
                                                    animation: req.status === 'running' ? 'pulse 1s infinite' : 'none',
                                                }} />
                                                {req.winner && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        right: 8,
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        fontSize: 10,
                                                        color: 'var(--accent)',
                                                        fontFamily: 'var(--font-mono)',
                                                        fontWeight: 600,
                                                    }}>
                                                        ★ WINNER
                                                    </div>
                                                )}
                                                {req.status === 'pending' && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        left: 8,
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        fontSize: 9,
                                                        color: 'var(--text-dim)',
                                                        fontFamily: 'var(--font-mono)',
                                                    }}>
                                                        waiting to launch…
                                                    </div>
                                                )}
                                            </div>

                                            <div style={{
                                                width: 60, fontFamily: 'var(--font-mono)', fontSize: 10,
                                                color: statusColor(req.status), textAlign: 'right', flexShrink: 0,
                                            }}>
                                                {req.status === 'pending' ? '—' : `${req.elapsed || 0}ms`}
                                            </div>

                                            <div style={{
                                                width: 72, fontFamily: 'var(--font-mono)', fontSize: 9,
                                                color: req.winner ? 'var(--accent)' : statusColor(req.status),
                                                textAlign: 'right', flexShrink: 0, textTransform: 'uppercase',
                                            }}>
                                                {req.status === 'timed-out' ? 'TIMEOUT' : req.status.toUpperCase()}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Latency comparison for completed rounds */}
                {!isRunning && rounds.length > 0 && rounds[0].outcome === 'success' && (
                    <div style={{
                        padding: '12px 16px',
                        borderRadius: 'var(--radius)',
                        background: 'rgba(0,255,136,0.06)',
                        border: '1px solid var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        marginTop: 8,
                        animation: 'fadeIn 300ms ease',
                    }}>
                        <span style={{ fontSize: 20, color: 'var(--accent)' }}>✓</span>
                        <div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
                                {rounds[0].winnerIndex === 0
                                    ? 'Primary request won!'
                                    : `Hedge #${rounds[0].winnerIndex} won — hedging saved latency!`}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                                Winner resolved in {rounds[0].requests.find(r => r.winner)?.elapsed}ms
                                {' '} / Primary latency was ~{rounds[0].requests[0].latencyMs}ms
                            </div>
                        </div>
                    </div>
                )}

                {!isRunning && rounds.length > 0 && rounds[0].outcome === 'all-failed' && (
                    <div style={{
                        padding: '12px 16px',
                        borderRadius: 'var(--radius)',
                        background: 'rgba(255,68,68,0.06)',
                        border: '1px solid var(--danger)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        marginTop: 8,
                        animation: 'fadeIn 300ms ease',
                    }}>
                        <span style={{ fontSize: 20, color: 'var(--danger)' }}>✗</span>
                        <div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--danger)', fontWeight: 600 }}>
                                All requests failed — no hedge succeeded
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                                All {1 + maxHedges} requests either errored or timed out
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Round History */}
            {rounds.length > 1 && (
                <div className="viz-container" style={{ minHeight: 'auto' }}>
                    <h3 style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                        // round history
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {rounds.slice(1, 10).map((round) => {
                            const winner = round.requests.find(r => r.winner);
                            return (
                                <div key={round.id} style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '6px 10px',
                                    background: 'var(--surface-2)',
                                    borderRadius: 'var(--radius)',
                                    border: `1px solid ${round.outcome === 'success' ? 'var(--border)' : 'var(--danger)'}`,
                                }}>
                                    <span style={{
                                        fontSize: 13,
                                        color: round.outcome === 'success' ? 'var(--accent)' : 'var(--danger)',
                                    }}>
                                        {round.outcome === 'success' ? '✓' : '✗'}
                                    </span>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)' }}>
                                        {round.totalElapsed}ms
                                    </span>
                                    {winner && (
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)' }}>
                                            {winner.index === 0 ? 'primary' : `hedge #${winner.index}`} won in {winner.elapsed}ms
                                        </span>
                                    )}
                                    <div style={{ flex: 1, display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                                        {round.requests.map(r => (
                                            <div key={r.id} style={{
                                                width: 14, height: 14,
                                                borderRadius: 2,
                                                background: r.winner ? 'var(--accent)' : statusColor(r.status),
                                                opacity: r.winner ? 1 : 0.4,
                                                border: r.winner ? '1px solid var(--accent)' : '1px solid transparent',
                                            }} />
                                        ))}
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
                    // configuration
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1 }}>Hedge Delay</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="range" min={100} max={2000} step={50} value={hedgeDelay}
                                onChange={e => setHedgeDelay(Number(e.target.value))} disabled={isRunning} style={{ flex: 1 }} />
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--warning)', width: 55, textAlign: 'right' }}>
                                {hedgeDelay}ms
                            </span>
                        </div>
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1 }}>Max Hedges</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="range" min={1} max={4} step={1} value={maxHedges}
                                onChange={e => setMaxHedges(Number(e.target.value))} disabled={isRunning} style={{ flex: 1 }} />
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--info)', width: 24, textAlign: 'right' }}>
                                {maxHedges}
                            </span>
                        </div>
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1 }}>Base Latency</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="range" min={200} max={2000} step={100} value={baseLatency}
                                onChange={e => setBaseLatency(Number(e.target.value))} disabled={isRunning} style={{ flex: 1 }} />
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--accent)', width: 55, textAlign: 'right' }}>
                                {baseLatency}ms
                            </span>
                        </div>
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1 }}>Latency Variance</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="range" min={1} max={4} step={0.25} value={latencyVariance}
                                onChange={e => setLatencyVariance(Number(e.target.value))} disabled={isRunning} style={{ flex: 1 }} />
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--warning)', width: 36, textAlign: 'right' }}>
                                ×{latencyVariance}
                            </span>
                        </div>
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1 }}>Failure Rate</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="range" min={0} max={1} step={0.05} value={failureRate}
                                onChange={e => setFailureRate(Number(e.target.value))} disabled={isRunning} style={{ flex: 1 }} />
                            <span style={{
                                fontFamily: 'var(--font-mono)', fontSize: 14, width: 40, textAlign: 'right',
                                color: failureRate > 0.5 ? 'var(--danger)' : 'var(--accent)',
                            }}>
                                {Math.round(failureRate * 100)}%
                            </span>
                        </div>
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1 }}>Timeout</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="range" min={500} max={6000} step={250} value={timeoutMs}
                                onChange={e => setTimeoutMs(Number(e.target.value))} disabled={isRunning} style={{ flex: 1 }} />
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--danger)', width: 55, textAlign: 'right' }}>
                                {timeoutMs}ms
                            </span>
                        </div>
                    </label>
                </div>

                {/* Quick Presets */}
                <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-dim)', alignSelf: 'center', marginRight: 4 }}>PRESETS:</span>
                    <button className="btn" disabled={isRunning} onClick={() => { setHedgeDelay(500); setMaxHedges(2); setBaseLatency(800); setLatencyVariance(1.5); setFailureRate(0.15); setTimeoutMs(3000); }}
                        style={{ fontSize: 10, padding: '4px 10px' }}>
                        ✓ Default
                    </button>
                    <button className="btn" disabled={isRunning} onClick={() => { setHedgeDelay(200); setMaxHedges(3); setBaseLatency(500); setLatencyVariance(3); setFailureRate(0); setTimeoutMs(4000); }}
                        style={{ fontSize: 10, padding: '4px 10px' }}>
                        🏎️ Tail Latency Heavy
                    </button>
                    <button className="btn" disabled={isRunning} onClick={() => { setHedgeDelay(300); setMaxHedges(2); setBaseLatency(600); setLatencyVariance(1.2); setFailureRate(0.6); setTimeoutMs(3000); }}
                        style={{ fontSize: 10, padding: '4px 10px' }}>
                        💥 Flaky Service
                    </button>
                    <button className="btn" disabled={isRunning} onClick={() => { setHedgeDelay(1000); setMaxHedges(1); setBaseLatency(1200); setLatencyVariance(1.5); setFailureRate(0.05); setTimeoutMs(2500); }}
                        style={{ fontSize: 10, padding: '4px 10px' }}>
                        ⏱ Tight Timeout
                    </button>
                </div>
            </div>

            {/* Event Log */}
            <div className="viz-container" style={{ minHeight: 'auto' }}>
                <h3 style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>// event log</h3>
                <div className="log-area">
                    {log.length === 0 && (
                        <div className="log-entry" style={{ color: 'var(--text-dim)' }}>
                            No events yet. Click &quot;Send Request&quot; to begin.
                        </div>
                    )}
                    {log.map(entry => (
                        <div
                            key={entry.id}
                            className={`log-entry ${entry.kind === 'success' ? 'allowed' : entry.kind === 'error' ? 'rejected' : ''}`}
                            style={{
                                color: entry.kind === 'hedge' ? 'var(--warning)'
                                    : entry.kind === 'cancelled' ? 'var(--text-dim)' : undefined,
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
                        <li>Send the <strong>primary request</strong> to the service.</li>
                        <li>If no response after <strong style={{ color: 'var(--warning)' }}>hedgeDelay</strong>, fire a <strong>duplicate (hedge)</strong> to another replica.</li>
                        <li>Whichever responds first <strong style={{ color: 'var(--accent)' }}>wins</strong> — cancel the others.</li>
                        <li>Repeat up to <strong>maxHedges</strong> additional copies.</li>
                        <li>The hedge delay is tuned to the p95/p99 of the service — only slow requests get hedged.</li>
                    </ul>
                </div>

                <div className="info-panel">
                    <h3>// trade-offs</h3>
                    <ul>
                        <li>Dramatically reduces tail latency (p99)</li>
                        <li>Minimal extra load if hedge delay is well-tuned</li>
                        <li>No wasted work — loser requests are cancelled</li>
                        <li className="con">Increases total request volume (up to 2–3×)</li>
                        <li className="con">Requires idempotent operations</li>
                        <li className="con">Can amplify load on an already-struggling service</li>
                        <li className="con">Need careful hedge delay tuning per endpoint</li>
                    </ul>
                </div>

                <div className="info-panel">
                    <h3>// real-world usage</h3>
                    <ul>
                        <li>Google &quot;The Tail at Scale&quot; — used extensively in BigTable, Spanner</li>
                        <li>gRPC hedging policy (built-in support)</li>
                        <li>DNS resolution with parallel queries</li>
                        <li>Database reads across replicas</li>
                        <li>Composition: <code style={{ color: 'var(--accent)' }}>hedged → timeout → circuit-breaker</code></li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
