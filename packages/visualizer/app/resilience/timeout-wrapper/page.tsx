'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

type TaskStatus = 'idle' | 'running' | 'success' | 'timed-out' | 'error';

interface TaskRun {
    id: number;
    status: TaskStatus;
    timeoutMs: number;
    taskDurationMs: number;
    startedAt: number;
    elapsed: number;
    finishedAt?: number;
}

const DEFAULTS = {
    timeoutMs: 2000,
    taskDurationMs: 1500,
    failureRate: 0.1,
};

export default function TimeoutWrapperPage() {
    const [timeoutMs, setTimeoutMs] = useState(DEFAULTS.timeoutMs);
    const [taskDurationMs, setTaskDurationMs] = useState(DEFAULTS.taskDurationMs);
    const [failureRate, setFailureRate] = useState(DEFAULTS.failureRate);

    const [runs, setRuns] = useState<TaskRun[]>([]);
    const [currentRun, setCurrentRun] = useState<TaskRun | null>(null);
    const [elapsed, setElapsed] = useState(0);

    const [totalRuns, setTotalRuns] = useState(0);
    const [totalSuccesses, setTotalSuccesses] = useState(0);
    const [totalTimeouts, setTotalTimeouts] = useState(0);
    const [totalErrors, setTotalErrors] = useState(0);

    const nextId = useRef(0);
    const cancelRef = useRef(false);
    const runStartRef = useRef(0);
    const animRef = useRef<number>(0);
    const lastTickRef = useRef(0);

    // Animation loop for live elapsed counter
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

    const run = useCallback(async () => {
        cancelRef.current = false;
        setElapsed(0);
        runStartRef.current = Date.now();
        setTotalRuns(r => r + 1);

        const id = nextId.current++;
        const task: TaskRun = {
            id,
            status: 'running',
            timeoutMs,
            taskDurationMs,
            startedAt: Date.now(),
            elapsed: 0,
        };

        setCurrentRun(task);

        // Simulate: race between task duration and timeout
        const actualDuration = taskDurationMs + (Math.random() * 400 - 200); // ±200ms jitter
        const willError = Math.random() < failureRate;

        const result = await new Promise<'success' | 'timed-out' | 'error'>((resolve) => {
            const timeoutTimer = setTimeout(() => {
                resolve('timed-out');
            }, timeoutMs);

            const taskTimer = setTimeout(() => {
                clearTimeout(timeoutTimer);
                if (willError) {
                    resolve('error');
                } else {
                    resolve('success');
                }
            }, actualDuration);

            // Store for cancellation
            cancelRef.current = false;
            const checkCancel = setInterval(() => {
                if (cancelRef.current) {
                    clearTimeout(timeoutTimer);
                    clearTimeout(taskTimer);
                    clearInterval(checkCancel);
                    resolve('error');
                }
            }, 50);

            // Clean up interval when done
            Promise.resolve().then(() => {
                setTimeout(() => clearInterval(checkCancel), Math.max(timeoutMs, actualDuration) + 100);
            });
        });

        if (cancelRef.current) {
            setCurrentRun(null);
            runStartRef.current = 0;
            return;
        }

        const finishedTask: TaskRun = {
            ...task,
            status: result,
            elapsed: Date.now() - task.startedAt,
            finishedAt: Date.now(),
        };

        setCurrentRun(null);
        setRuns(prev => [finishedTask, ...prev]);
        runStartRef.current = 0;

        if (result === 'success') setTotalSuccesses(s => s + 1);
        else if (result === 'timed-out') setTotalTimeouts(t => t + 1);
        else setTotalErrors(e => e + 1);
    }, [timeoutMs, taskDurationMs, failureRate]);

    const cancel = useCallback(() => {
        cancelRef.current = true;
        setCurrentRun(null);
        runStartRef.current = 0;
    }, []);

    const reset = useCallback(() => {
        cancel();
        setRuns([]);
        setCurrentRun(null);
        setElapsed(0);
        setTotalRuns(0);
        setTotalSuccesses(0);
        setTotalTimeouts(0);
        setTotalErrors(0);
    }, [cancel]);

    const statusColor = (s: TaskStatus) => {
        switch (s) {
            case 'success': return 'var(--accent)';
            case 'timed-out': return 'var(--danger)';
            case 'error': return 'var(--warning)';
            case 'running': return 'var(--info)';
            default: return 'var(--text-dim)';
        }
    };

    const statusIcon = (s: TaskStatus) => {
        switch (s) {
            case 'success': return '✓';
            case 'timed-out': return '⏱';
            case 'error': return '✗';
            case 'running': return '●';
            default: return '·';
        }
    };

    const statusLabel = currentRun
        ? 'RUNNING'
        : runs.length > 0
            ? runs[0].status === 'success' ? 'SUCCEEDED'
                : runs[0].status === 'timed-out' ? 'TIMED OUT'
                    : 'ERRORED'
            : 'IDLE';

    const statusLabelColor = currentRun
        ? 'var(--info)'
        : runs.length > 0
            ? statusColor(runs[0].status)
            : 'var(--text-dim)';

    // Calculate the visual bar scale
    const barMax = Math.max(timeoutMs, taskDurationMs) * 1.4;

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">resilience</span>
                <h1>Timeout Wrapper</h1>
                <p className="subtitle">Race an operation against a deadline — fail fast instead of waiting forever</p>
            </div>

            {/* Stats Row */}
            <div className="stats-row">
                <div className="stat">
                    <span className="stat-label">Status</span>
                    <span className="stat-value" style={{ color: statusLabelColor }}>{statusLabel}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Timeout</span>
                    <span className="stat-value warning">{timeoutMs}ms</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Elapsed</span>
                    <span className="stat-value" style={{ color: currentRun && elapsed > timeoutMs ? 'var(--danger)' : 'var(--info)' }}>
                        {currentRun ? `${(elapsed / 1000).toFixed(1)}s` : runs.length > 0 ? `${(runs[0].elapsed / 1000).toFixed(1)}s` : '0.0s'}
                    </span>
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
                    <span className="stat-label">Timeouts</span>
                    <span className="stat-value danger">{totalTimeouts}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Errors</span>
                    <span className="stat-value warning">{totalErrors}</span>
                </div>
            </div>

            {/* Main Visualization */}
            <div className="viz-container" style={{ minHeight: 380 }}>
                <div className="viz-controls">
                    <button className="btn btn-accent" onClick={run} disabled={!!currentRun}>
                        ▶ Execute Task
                    </button>
                    {currentRun && (
                        <button className="btn btn-danger" onClick={cancel}>✕ Cancel</button>
                    )}
                    <button className="btn" onClick={reset}>Reset</button>
                    {currentRun && (
                        <span style={{ fontSize: 11, color: 'var(--info)', animation: 'pulse 1s infinite' }}>
                            ● Racing task vs timeout…
                        </span>
                    )}
                </div>

                {/* Race Visualization */}
                <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Promise.race Visualization
                    </div>

                    {/* Timeout Deadline Bar */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            <div style={{
                                width: 90, fontFamily: 'var(--font-mono)', fontSize: 11,
                                color: 'var(--danger)', flexShrink: 0,
                            }}>
                                ⏱ timeout
                            </div>
                            <div style={{ flex: 1, position: 'relative', height: 28 }}>
                                <div style={{
                                    width: `${(timeoutMs / barMax) * 100}%`,
                                    height: '100%',
                                    background: 'var(--danger)',
                                    opacity: 0.25,
                                    borderRadius: 'var(--radius)',
                                }} />
                                {/* Deadline line */}
                                <div style={{
                                    position: 'absolute',
                                    left: `${(timeoutMs / barMax) * 100}%`,
                                    top: -4,
                                    bottom: -4,
                                    width: 2,
                                    background: 'var(--danger)',
                                    boxShadow: '0 0 8px var(--danger-glow)',
                                }} />
                                <span style={{
                                    position: 'absolute',
                                    left: `${(timeoutMs / barMax) * 100}%`,
                                    top: -16,
                                    transform: 'translateX(-50%)',
                                    fontSize: 9,
                                    color: 'var(--danger)',
                                    fontFamily: 'var(--font-mono)',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {timeoutMs}ms deadline
                                </span>
                            </div>
                        </div>

                        {/* Task Progress Bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                                width: 90, fontFamily: 'var(--font-mono)', fontSize: 11,
                                color: 'var(--accent)', flexShrink: 0,
                            }}>
                                ● task
                            </div>
                            <div style={{ flex: 1, position: 'relative', height: 28 }}>
                                {/* Expected duration background */}
                                <div style={{
                                    width: `${(taskDurationMs / barMax) * 100}%`,
                                    height: '100%',
                                    background: 'var(--accent)',
                                    opacity: 0.15,
                                    borderRadius: 'var(--radius)',
                                    border: '1px dashed var(--accent)',
                                }} />
                                {/* Live progress */}
                                {currentRun && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: `${Math.min((elapsed / barMax) * 100, 100)}%`,
                                        height: '100%',
                                        background: elapsed > timeoutMs ? 'var(--danger)' : 'var(--info)',
                                        opacity: 0.6,
                                        borderRadius: 'var(--radius)',
                                        transition: 'width 0.1s linear',
                                        animation: 'pulse 1s infinite',
                                    }} />
                                )}
                                <span style={{
                                    position: 'absolute',
                                    left: `${(taskDurationMs / barMax) * 100}%`,
                                    top: '50%',
                                    transform: 'translate(8px, -50%)',
                                    fontSize: 9,
                                    color: 'var(--text-dim)',
                                    fontFamily: 'var(--font-mono)',
                                    whiteSpace: 'nowrap',
                                }}>
                                    ~{taskDurationMs}ms expected
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Result indicator */}
                    {!currentRun && runs.length > 0 && (
                        <div style={{
                            padding: '12px 16px',
                            borderRadius: 'var(--radius)',
                            background: runs[0].status === 'success' ? 'rgba(0,255,136,0.06)' :
                                runs[0].status === 'timed-out' ? 'rgba(255,51,102,0.06)' : 'rgba(255,170,0,0.06)',
                            border: `1px solid ${statusColor(runs[0].status)}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            marginTop: 8,
                            animation: 'fadeIn 300ms ease',
                        }}>
                            <span style={{ fontSize: 20 }}>{statusIcon(runs[0].status)}</span>
                            <div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: statusColor(runs[0].status), fontWeight: 600 }}>
                                    {runs[0].status === 'success' && 'Task completed before deadline!'}
                                    {runs[0].status === 'timed-out' && 'Timeout! Task was too slow — operation aborted.'}
                                    {runs[0].status === 'error' && 'Task failed with an error before timeout.'}
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                                    Elapsed: {runs[0].elapsed}ms / Deadline: {runs[0].timeoutMs}ms
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* History */}
                {runs.length > 0 && (
                    <div style={{ marginTop: 24 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                            Run History
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {runs.slice(0, 12).map((r) => {
                                const pct = Math.min((r.elapsed / r.timeoutMs) * 100, 150);
                                return (
                                    <div key={r.id} style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        animation: 'fadeIn 200ms ease',
                                    }}>
                                        <div style={{
                                            width: 20, fontFamily: 'var(--font-mono)', fontSize: 13,
                                            color: statusColor(r.status), flexShrink: 0, textAlign: 'center',
                                        }}>
                                            {statusIcon(r.status)}
                                        </div>

                                        <div style={{ flex: 1, position: 'relative', height: 20, background: 'var(--surface)', borderRadius: 'var(--radius)' }}>
                                            {/* Timeout boundary */}
                                            <div style={{
                                                position: 'absolute',
                                                left: `${Math.min((r.timeoutMs / (r.timeoutMs * 1.5)) * 100, 100)}%`,
                                                top: 0, bottom: 0, width: 1,
                                                background: 'var(--danger)', opacity: 0.5,
                                            }} />
                                            {/* Elapsed bar */}
                                            <div style={{
                                                width: `${Math.min(pct / 1.5, 100)}%`,
                                                height: '100%',
                                                background: statusColor(r.status),
                                                opacity: 0.5,
                                                borderRadius: 'var(--radius)',
                                            }} />
                                        </div>

                                        <div style={{
                                            width: 80, fontFamily: 'var(--font-mono)', fontSize: 10,
                                            color: statusColor(r.status), textAlign: 'right', flexShrink: 0,
                                        }}>
                                            {r.elapsed}ms
                                        </div>

                                        <div style={{
                                            width: 72, fontFamily: 'var(--font-mono)', fontSize: 9,
                                            color: statusColor(r.status), textAlign: 'right', flexShrink: 0,
                                            textTransform: 'uppercase',
                                        }}>
                                            {r.status === 'timed-out' ? 'TIMEOUT' : r.status.toUpperCase()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Configuration */}
            <div className="viz-container" style={{ minHeight: 'auto' }}>
                <h3 style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                    // configuration
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1 }}>Timeout (deadline)</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="range" min={200} max={5000} step={100} value={timeoutMs}
                                onChange={e => setTimeoutMs(Number(e.target.value))} disabled={!!currentRun} style={{ flex: 1 }} />
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--danger)', width: 55, textAlign: 'right' }}>
                                {timeoutMs}ms
                            </span>
                        </div>
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1 }}>Task Duration (expected)</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="range" min={200} max={5000} step={100} value={taskDurationMs}
                                onChange={e => setTaskDurationMs(Number(e.target.value))} disabled={!!currentRun} style={{ flex: 1 }} />
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--accent)', width: 55, textAlign: 'right' }}>
                                {taskDurationMs}ms
                            </span>
                        </div>
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1 }}>Failure Rate</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="range" min={0} max={1} step={0.05} value={failureRate}
                                onChange={e => setFailureRate(Number(e.target.value))} disabled={!!currentRun} style={{ flex: 1 }} />
                            <span style={{
                                fontFamily: 'var(--font-mono)', fontSize: 14, width: 40, textAlign: 'right',
                                color: failureRate > 0.5 ? 'var(--danger)' : 'var(--accent)',
                            }}>
                                {Math.round(failureRate * 100)}%
                            </span>
                        </div>
                    </label>
                </div>

                {/* Quick Presets */}
                <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-dim)', alignSelf: 'center', marginRight: 4 }}>PRESETS:</span>
                    <button className="btn" disabled={!!currentRun} onClick={() => { setTimeoutMs(2000); setTaskDurationMs(800); setFailureRate(0); }}
                        style={{ fontSize: 10, padding: '4px 10px' }}>
                        ✓ Fast Task (safe)
                    </button>
                    <button className="btn" disabled={!!currentRun} onClick={() => { setTimeoutMs(1500); setTaskDurationMs(1400); setFailureRate(0); }}
                        style={{ fontSize: 10, padding: '4px 10px' }}>
                        ⚡ Close Call
                    </button>
                    <button className="btn" disabled={!!currentRun} onClick={() => { setTimeoutMs(1000); setTaskDurationMs(3000); setFailureRate(0); }}
                        style={{ fontSize: 10, padding: '4px 10px' }}>
                        ⏱ Guaranteed Timeout
                    </button>
                    <button className="btn" disabled={!!currentRun} onClick={() => { setTimeoutMs(2000); setTaskDurationMs(1500); setFailureRate(0.7); }}
                        style={{ fontSize: 10, padding: '4px 10px' }}>
                        💥 Flaky Service
                    </button>
                </div>
            </div>

            {/* Event Log */}
            <div className="viz-container" style={{ minHeight: 'auto' }}>
                <h3 style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>// event log</h3>
                <div className="log-area">
                    {runs.length === 0 && !currentRun && (
                        <div className="log-entry" style={{ color: 'var(--text-dim)' }}>
                            No events yet. Click &quot;Execute Task&quot; to begin.
                        </div>
                    )}
                    {currentRun && (
                        <div className="log-entry" style={{ color: 'var(--info)' }}>
                            <span className="timestamp">[{new Date(currentRun.startedAt).toISOString().slice(11, 23)}]</span>
                            ● EXECUTING — racing task (~{currentRun.taskDurationMs}ms) vs timeout ({currentRun.timeoutMs}ms)…
                        </div>
                    )}
                    {runs.map(r => (
                        <div key={r.id} className={`log-entry ${r.status === 'success' ? 'allowed' : 'rejected'}`}>
                            <span className="timestamp">[{new Date(r.startedAt).toISOString().slice(11, 23)}]</span>
                            {r.status === 'success' && `✓ COMPLETED in ${r.elapsed}ms (deadline: ${r.timeoutMs}ms)`}
                            {r.status === 'timed-out' && `⏱ TIMED OUT after ${r.timeoutMs}ms — task was too slow`}
                            {r.status === 'error' && `✗ FAILED at ${r.elapsed}ms — task threw an error`}
                        </div>
                    ))}
                </div>
            </div>

            {/* Info Panels */}
            <div className="info-columns">
                <div className="info-panel">
                    <h3>// how it works</h3>
                    <ul>
                        <li>Wrap an async operation with a maximum deadline.</li>
                        <li>Use <code style={{ color: 'var(--accent)' }}>Promise.race([action(), timeoutPromise])</code> to race them.</li>
                        <li>If the action resolves first → return its result.</li>
                        <li>If the timeout fires first → throw a <code style={{ color: 'var(--danger)' }}>TimeoutError</code>.</li>
                        <li>Always clean up the timer with <code style={{ color: 'var(--warning)' }}>clearTimeout</code> in a <code>finally</code> block.</li>
                    </ul>
                </div>

                <div className="info-panel">
                    <h3>// trade-offs</h3>
                    <ul>
                        <li>Prevents indefinite waits on hung services</li>
                        <li>Frees up resources quickly when services are slow</li>
                        <li>Pairs well with retries and circuit breakers</li>
                        <li className="con">Does not cancel the underlying operation (JS limitation)</li>
                        <li className="con">Too-tight timeouts cause false failures on legitimate slow responses</li>
                        <li className="con">Need to choose timeout values carefully per endpoint</li>
                    </ul>
                </div>

                <div className="info-panel">
                    <h3>// real-world usage</h3>
                    <ul>
                        <li>HTTP client timeouts (e.g., Axios, fetch with AbortController)</li>
                        <li>Database query timeouts</li>
                        <li>Microservice-to-microservice RPC calls</li>
                        <li>Composition: <code style={{ color: 'var(--accent)' }}>timeout → retry → circuit-breaker</code></li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
