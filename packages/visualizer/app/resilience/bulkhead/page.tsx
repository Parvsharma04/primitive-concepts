'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

/* ── Types ── */

type SlotStatus = 'idle' | 'running' | 'success' | 'error' | 'rejected';

interface Task {
    id: number;
    status: SlotStatus;
    durationMs: number;
    startedAt: number;
    elapsed: number;
    finishedAt?: number;
    zone: 'active' | 'queued' | 'done';
}

interface LogEntry {
    id: number;
    time: number;
    message: string;
    kind: 'info' | 'success' | 'error' | 'rejected';
}

const DEFAULTS = {
    maxConcurrent: 3,
    maxQueued: 4,
    taskDurationMs: 2000,
    failureRate: 0.15,
};

/* ── Helpers ── */

const statusColor = (s: SlotStatus) => {
    switch (s) {
        case 'running': return 'var(--info)';
        case 'success': return 'var(--accent)';
        case 'error': return 'var(--warning)';
        case 'rejected': return 'var(--danger)';
        default: return 'var(--text-dim)';
    }
};

const statusIcon = (s: SlotStatus) => {
    switch (s) {
        case 'running': return '●';
        case 'success': return '✓';
        case 'error': return '✗';
        case 'rejected': return '⊘';
        default: return '·';
    }
};

/* ── Component ── */

export default function BulkheadPage() {
    const [maxConcurrent, setMaxConcurrent] = useState(DEFAULTS.maxConcurrent);
    const [maxQueued, setMaxQueued] = useState(DEFAULTS.maxQueued);
    const [taskDurationMs, setTaskDurationMs] = useState(DEFAULTS.taskDurationMs);
    const [failureRate, setFailureRate] = useState(DEFAULTS.failureRate);

    const [activeTasks, setActiveTasks] = useState<Task[]>([]);
    const [queuedTasks, setQueuedTasks] = useState<Task[]>([]);
    const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
    const [log, setLog] = useState<LogEntry[]>([]);

    const [totalSubmitted, setTotalSubmitted] = useState(0);
    const [totalSuccess, setTotalSuccess] = useState(0);
    const [totalErrors, setTotalErrors] = useState(0);
    const [totalRejected, setTotalRejected] = useState(0);

    const nextId = useRef(0);
    const animRef = useRef<number>(0);
    const lastTickRef = useRef(0);

    // Live refs for the simulation engine (avoids stale closures)
    const activeRef = useRef<Task[]>([]);
    const queueRef = useRef<Task[]>([]);
    const maxConcurrentRef = useRef(maxConcurrent);
    const maxQueuedRef = useRef(maxQueued);

    useEffect(() => { maxConcurrentRef.current = maxConcurrent; }, [maxConcurrent]);
    useEffect(() => { maxQueuedRef.current = maxQueued; }, [maxQueued]);

    /* Sync refs → state at ~20 fps so the UI updates smoothly */
    useEffect(() => {
        const TICK = 50;
        const loop = (ts: number) => {
            if (ts - lastTickRef.current >= TICK) {
                lastTickRef.current = ts;
                const now = Date.now();

                // Update elapsed on active tasks
                activeRef.current = activeRef.current.map(t => ({ ...t, elapsed: now - t.startedAt }));
                setActiveTasks([...activeRef.current]);
                setQueuedTasks([...queueRef.current]);
            }
            animRef.current = requestAnimationFrame(loop);
        };
        animRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animRef.current);
    }, []);

    /* ── Core: finish a task, then try to promote from queue ── */
    const finishTask = useCallback((taskId: number, outcome: 'success' | 'error') => {
        const idx = activeRef.current.findIndex(t => t.id === taskId);
        if (idx === -1) return;

        const task = activeRef.current[idx];
        const finished: Task = {
            ...task,
            status: outcome,
            elapsed: Date.now() - task.startedAt,
            finishedAt: Date.now(),
            zone: 'done',
        };

        // Remove from active
        activeRef.current.splice(idx, 1);

        setCompletedTasks(prev => [finished, ...prev]);
        if (outcome === 'success') setTotalSuccess(s => s + 1);
        else setTotalErrors(e => e + 1);

        setLog(prev => [{
            id: finished.id * 1000 + 1,
            time: Date.now(),
            message: outcome === 'success'
                ? `✓ Task #${finished.id} completed in ${finished.elapsed}ms`
                : `✗ Task #${finished.id} failed after ${finished.elapsed}ms`,
            kind: outcome,
        }, ...prev].slice(0, 50));

        // Promote next queued task if any
        if (queueRef.current.length > 0) {
            const next = queueRef.current.shift()!;
            startExecution(next);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ── Start executing a task (put it in active slots) ── */
    const startExecution = useCallback((task: Task) => {
        const running: Task = { ...task, status: 'running', startedAt: Date.now(), elapsed: 0, zone: 'active' };
        activeRef.current.push(running);

        const jitter = (Math.random() - 0.5) * task.durationMs * 0.4; // ±20%
        const actualDuration = Math.max(200, task.durationMs + jitter);
        const willFail = Math.random() < failureRate;

        setLog(prev => [{
            id: running.id * 1000,
            time: Date.now(),
            message: `● Task #${running.id} started (slot ${activeRef.current.length}/${maxConcurrentRef.current})`,
            kind: 'info' as const,
        }, ...prev].slice(0, 50));

        setTimeout(() => {
            finishTask(running.id, willFail ? 'error' : 'success');
        }, actualDuration);
    }, [failureRate, finishTask]);

    /* ── Submit a new task ── */
    const submit = useCallback(() => {
        const id = nextId.current++;
        const task: Task = {
            id,
            status: 'idle',
            durationMs: taskDurationMs,
            startedAt: 0,
            elapsed: 0,
            zone: 'queued',
        };

        setTotalSubmitted(s => s + 1);

        // Can we run immediately?
        if (activeRef.current.length < maxConcurrentRef.current) {
            startExecution(task);
            return;
        }

        // Can we queue?
        if (queueRef.current.length < maxQueuedRef.current) {
            queueRef.current.push(task);

            setLog(prev => [{
                id: id * 1000 + 2,
                time: Date.now(),
                message: `◷ Task #${id} queued (queue ${queueRef.current.length}/${maxQueuedRef.current})`,
                kind: 'info' as const,
            }, ...prev].slice(0, 50));
            return;
        }

        // Reject
        setTotalRejected(r => r + 1);
        setCompletedTasks(prev => [{
            ...task, status: 'rejected', finishedAt: Date.now(), zone: 'done',
        }, ...prev]);

        setLog(prev => [{
            id: id * 1000 + 3,
            time: Date.now(),
            message: `⊘ Task #${id} REJECTED — bulkhead full (${activeRef.current.length} active, ${queueRef.current.length} queued)`,
            kind: 'rejected' as const,
        }, ...prev].slice(0, 50));
    }, [taskDurationMs, startExecution]);

    /* ── Burst: submit N tasks at once ── */
    const burst = useCallback((n: number) => {
        for (let i = 0; i < n; i++) submit();
    }, [submit]);

    /* ── Reset ── */
    const reset = useCallback(() => {
        activeRef.current = [];
        queueRef.current = [];
        setActiveTasks([]);
        setQueuedTasks([]);
        setCompletedTasks([]);
        setLog([]);
        setTotalSubmitted(0);
        setTotalSuccess(0);
        setTotalErrors(0);
        setTotalRejected(0);
    }, []);

    const isIdle = activeTasks.length === 0 && queuedTasks.length === 0;

    return (
        <div className="animate-in">
            <div className="page-header">
                <span className="category-tag">resilience</span>
                <h1>Bulkhead Pattern</h1>
                <p className="subtitle">
                    Isolate workloads into fixed-capacity compartments — prevent one overwhelmed resource from starving the rest
                </p>
            </div>

            {/* Stats Row */}
            <div className="stats-row">
                <div className="stat">
                    <span className="stat-label">Active</span>
                    <span className="stat-value" style={{ color: activeTasks.length >= maxConcurrent ? 'var(--danger)' : 'var(--info)' }}>
                        {activeTasks.length}/{maxConcurrent}
                    </span>
                </div>
                <div className="stat">
                    <span className="stat-label">Queued</span>
                    <span className="stat-value" style={{ color: queuedTasks.length >= maxQueued ? 'var(--warning)' : 'var(--text-bright)' }}>
                        {queuedTasks.length}/{maxQueued}
                    </span>
                </div>
                <div className="stat">
                    <span className="stat-label">Submitted</span>
                    <span className="stat-value">{totalSubmitted}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Succeeded</span>
                    <span className="stat-value accent">{totalSuccess}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Errors</span>
                    <span className="stat-value warning">{totalErrors}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Rejected</span>
                    <span className="stat-value danger">{totalRejected}</span>
                </div>
            </div>

            {/* Main Visualization */}
            <div className="viz-container" style={{ minHeight: 360 }}>
                <div className="viz-controls">
                    <button className="btn btn-accent" onClick={submit}>+ Submit Task</button>
                    <button className="btn" onClick={() => burst(3)}>⚡ Burst ×3</button>
                    <button className="btn" onClick={() => burst(maxConcurrent + maxQueued + 2)}>💥 Overflow</button>
                    <button className="btn btn-danger" onClick={reset}>Reset</button>
                </div>

                {/* ── Ship Hull Compartment Visualization ── */}
                <div style={{ marginTop: 8 }}>
                    {/* Execution Slots */}
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                            Execution Slots ({activeTasks.length}/{maxConcurrent})
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {Array.from({ length: maxConcurrent }).map((_, i) => {
                                const task = activeTasks[i];
                                const pct = task ? Math.min((task.elapsed / task.durationMs) * 100, 100) : 0;
                                return (
                                    <div key={i} style={{
                                        width: 120,
                                        height: 80,
                                        border: `1px solid ${task ? 'var(--info)' : 'var(--border-bright)'}`,
                                        borderRadius: 'var(--radius)',
                                        background: task ? 'var(--info-glow)' : 'var(--surface-2)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        transition: 'all 200ms ease',
                                    }}>
                                        {/* Progress fill */}
                                        {task && (
                                            <div style={{
                                                position: 'absolute',
                                                bottom: 0,
                                                left: 0,
                                                width: '100%',
                                                height: `${pct}%`,
                                                background: 'var(--info)',
                                                opacity: 0.15,
                                                transition: 'height 0.1s linear',
                                            }} />
                                        )}
                                        {task ? (
                                            <>
                                                <div style={{ fontSize: 16, color: 'var(--info)', animation: 'pulse 1s infinite', zIndex: 1 }}>●</div>
                                                <div style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', zIndex: 1, marginTop: 4 }}>
                                                    #{task.id}
                                                </div>
                                                <div style={{ fontSize: 9, color: 'var(--info)', fontFamily: 'var(--font-mono)', zIndex: 1 }}>
                                                    {task.elapsed}ms
                                                </div>
                                            </>
                                        ) : (
                                            <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>empty</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Queue */}
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                            Queue ({queuedTasks.length}/{maxQueued})
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', minHeight: 36 }}>
                            {Array.from({ length: maxQueued }).map((_, i) => {
                                const task = queuedTasks[i];
                                return (
                                    <div key={i} style={{
                                        width: 60,
                                        height: 36,
                                        border: `1px solid ${task ? 'var(--warning)' : 'var(--border)'}`,
                                        borderRadius: 'var(--radius)',
                                        background: task ? 'var(--warning-glow)' : 'var(--surface-2)',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        fontSize: 9,
                                        fontFamily: 'var(--font-mono)',
                                        color: task ? 'var(--warning)' : 'var(--text-dim)',
                                        transition: 'all 200ms ease',
                                    }}>
                                        {task ? `#${task.id}` : '·'}
                                    </div>
                                );
                            })}
                            {queuedTasks.length === 0 && maxQueued > 0 && (
                                <span style={{ fontSize: 10, color: 'var(--text-dim)', alignSelf: 'center', marginLeft: 8 }}>
                                    queue empty
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Rejection zone indicator */}
                    {totalRejected > 0 && (
                        <div style={{
                            padding: '10px 16px',
                            borderRadius: 'var(--radius)',
                            background: 'rgba(255,68,68,0.06)',
                            border: '1px solid var(--danger)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            animation: 'fadeIn 300ms ease',
                            marginBottom: 16,
                        }}>
                            <span style={{ fontSize: 18, color: 'var(--danger)' }}>⊘</span>
                            <div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--danger)', fontWeight: 600 }}>
                                    {totalRejected} task{totalRejected > 1 ? 's' : ''} rejected — bulkhead capacity exhausted
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                                    {maxConcurrent} slots + {maxQueued} queue = {maxConcurrent + maxQueued} max in-flight
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recent completions */}
                    {completedTasks.length > 0 && (
                        <div>
                            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                                Recent Completions
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {completedTasks.slice(0, 10).map(t => (
                                    <div key={t.id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        animation: 'fadeIn 200ms ease',
                                    }}>
                                        <div style={{
                                            width: 18,
                                            fontFamily: 'var(--font-mono)',
                                            fontSize: 13,
                                            color: statusColor(t.status),
                                            flexShrink: 0,
                                            textAlign: 'center',
                                        }}>
                                            {statusIcon(t.status)}
                                        </div>
                                        <div style={{
                                            flex: 1,
                                            position: 'relative',
                                            height: 18,
                                            background: 'var(--surface-2)',
                                            borderRadius: 'var(--radius)',
                                            overflow: 'hidden',
                                        }}>
                                            {t.status !== 'rejected' && (
                                                <div style={{
                                                    width: `${Math.min((t.elapsed / t.durationMs) * 100, 100)}%`,
                                                    height: '100%',
                                                    background: statusColor(t.status),
                                                    opacity: 0.4,
                                                    borderRadius: 'var(--radius)',
                                                }} />
                                            )}
                                        </div>
                                        <div style={{
                                            width: 40,
                                            fontSize: 9,
                                            fontFamily: 'var(--font-mono)',
                                            color: 'var(--text-dim)',
                                            textAlign: 'right',
                                        }}>
                                            #{t.id}
                                        </div>
                                        <div style={{
                                            width: 60,
                                            fontSize: 9,
                                            fontFamily: 'var(--font-mono)',
                                            color: statusColor(t.status),
                                            textAlign: 'right',
                                        }}>
                                            {t.status === 'rejected' ? 'REJECTED' : `${t.elapsed}ms`}
                                        </div>
                                        <div style={{
                                            width: 60,
                                            fontSize: 9,
                                            fontFamily: 'var(--font-mono)',
                                            color: statusColor(t.status),
                                            textAlign: 'right',
                                            textTransform: 'uppercase',
                                        }}>
                                            {t.status}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Configuration */}
            <div className="viz-container" style={{ minHeight: 'auto' }}>
                <h3 style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                    // configuration
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1 }}>Max Concurrent</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="range" min={1} max={8} step={1} value={maxConcurrent}
                                onChange={e => setMaxConcurrent(Number(e.target.value))} disabled={!isIdle} style={{ flex: 1 }} />
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--info)', width: 30, textAlign: 'right' }}>
                                {maxConcurrent}
                            </span>
                        </div>
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1 }}>Max Queued</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="range" min={0} max={10} step={1} value={maxQueued}
                                onChange={e => setMaxQueued(Number(e.target.value))} disabled={!isIdle} style={{ flex: 1 }} />
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--warning)', width: 30, textAlign: 'right' }}>
                                {maxQueued}
                            </span>
                        </div>
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1 }}>Task Duration</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="range" min={500} max={6000} step={250} value={taskDurationMs}
                                onChange={e => setTaskDurationMs(Number(e.target.value))} style={{ flex: 1 }} />
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--accent)', width: 55, textAlign: 'right' }}>
                                {taskDurationMs}ms
                            </span>
                        </div>
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1 }}>Failure Rate</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="range" min={0} max={1} step={0.05} value={failureRate}
                                onChange={e => setFailureRate(Number(e.target.value))} style={{ flex: 1 }} />
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
                    <button className="btn" disabled={!isIdle} onClick={() => { setMaxConcurrent(3); setMaxQueued(4); setTaskDurationMs(2000); setFailureRate(0.1); }}
                        style={{ fontSize: 10, padding: '4px 10px' }}>
                        ✓ Default
                    </button>
                    <button className="btn" disabled={!isIdle} onClick={() => { setMaxConcurrent(1); setMaxQueued(2); setTaskDurationMs(3000); setFailureRate(0); }}
                        style={{ fontSize: 10, padding: '4px 10px' }}>
                        🔒 Tight (1 slot)
                    </button>
                    <button className="btn" disabled={!isIdle} onClick={() => { setMaxConcurrent(5); setMaxQueued(0); setTaskDurationMs(1500); setFailureRate(0); }}
                        style={{ fontSize: 10, padding: '4px 10px' }}>
                        ⚡ No Queue
                    </button>
                    <button className="btn" disabled={!isIdle} onClick={() => { setMaxConcurrent(2); setMaxQueued(3); setTaskDurationMs(2500); setFailureRate(0.6); }}
                        style={{ fontSize: 10, padding: '4px 10px' }}>
                        💥 Flaky + Tight
                    </button>
                </div>
            </div>

            {/* Event Log */}
            <div className="viz-container" style={{ minHeight: 'auto' }}>
                <h3 style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>// event log</h3>
                <div className="log-area">
                    {log.length === 0 && (
                        <div className="log-entry" style={{ color: 'var(--text-dim)' }}>
                            No events yet. Submit a task to begin.
                        </div>
                    )}
                    {log.map(entry => (
                        <div
                            key={entry.id}
                            className={`log-entry ${entry.kind === 'success' ? 'allowed' : entry.kind === 'rejected' ? 'rejected' : ''}`}
                            style={{ color: entry.kind === 'error' ? 'var(--warning)' : undefined }}
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
                        <li>Named after watertight compartments in a ship&apos;s hull.</li>
                        <li>Limit concurrent executions with a fixed number of <strong>slots</strong>.</li>
                        <li>When slots are full, excess tasks wait in a bounded <strong>queue</strong>.</li>
                        <li>When both slots and queue are full, new tasks are <strong>rejected immediately</strong>.</li>
                        <li>When a running task finishes (success or error), the next queued task is promoted.</li>
                        <li>Failing tasks still release their slot — errors don&apos;t leak capacity.</li>
                    </ul>
                </div>

                <div className="info-panel">
                    <h3>// trade-offs</h3>
                    <ul>
                        <li>Prevents resource exhaustion from one misbehaving dependency</li>
                        <li>Provides back-pressure — callers learn immediately when capacity is full</li>
                        <li>Isolates workloads so failure in one partition doesn&apos;t cascade</li>
                        <li className="con">Sizing slots &amp; queue too small causes unnecessary rejections</li>
                        <li className="con">Sizing too large defeats the purpose of isolation</li>
                        <li className="con">Requires tuning per-service based on observed concurrency</li>
                    </ul>
                </div>

                <div className="info-panel">
                    <h3>// real-world usage</h3>
                    <ul>
                        <li>Hystrix / Resilience4j bulkhead (Java microservices)</li>
                        <li>Thread pool isolation per downstream dependency</li>
                        <li>Connection pool limits per database / service</li>
                        <li>Kubernetes resource quotas per namespace</li>
                        <li>Composition: <code style={{ color: 'var(--accent)' }}>bulkhead → timeout → retry → circuit-breaker</code></li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
