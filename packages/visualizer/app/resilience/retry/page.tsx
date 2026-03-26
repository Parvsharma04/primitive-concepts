'use client';

import { useState, useRef, useCallback } from 'react';

const MAX_RETRIES = 5;
const INITIAL_DELAY = 200; // ms
const MAX_DELAY = 5000;

type AttemptStatus = 'pending' | 'running' | 'failed' | 'success';

interface Attempt {
  id: number;
  number: number;        // 0-indexed attempt
  status: AttemptStatus;
  delay: number;         // wait before this attempt (0 for first)
  jitteredDelay: number; // actual delay after jitter
  startedAt: number;
  finishedAt?: number;
}

interface RunResult {
  attempts: Attempt[];
  finalStatus: 'idle' | 'running' | 'success' | 'exhausted';
}

export default function RetryPage() {
  const [result, setResult] = useState<RunResult>({ attempts: [], finalStatus: 'idle' });
  const [failureRate, setFailureRate] = useState(70); // % chance of failure
  const [jitterEnabled, setJitterEnabled] = useState(false);
  const [maxDelayEnabled, setMaxDelayEnabled] = useState(true);
  const runIdRef = useRef(0);
  const isRunningRef = useRef(false);

  const runSimulation = useCallback(async () => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    const runId = ++runIdRef.current;

    const attempts: Attempt[] = [];

    setResult({ attempts: [], finalStatus: 'running' });

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (runId !== runIdRef.current) return; // cancelled

      // Calculate delay for this attempt
      let delay = 0;
      let jitteredDelay = 0;
      if (attempt > 0) {
        delay = INITIAL_DELAY * Math.pow(2, attempt - 1);
        if (maxDelayEnabled) delay = Math.min(delay, MAX_DELAY);
        jitteredDelay = jitterEnabled ? Math.random() * delay : delay;
      }

      const entry: Attempt = {
        id: attempt,
        number: attempt,
        status: 'pending',
        delay,
        jitteredDelay,
        startedAt: Date.now(),
      };

      // Show pending state with delay
      attempts.push(entry);
      setResult({ attempts: [...attempts], finalStatus: 'running' });

      // Wait for backoff delay
      if (jitteredDelay > 0) {
        await new Promise(r => setTimeout(r, Math.min(jitteredDelay, 3000))); // cap visual wait at 3s
        if (runId !== runIdRef.current) return;
      }

      // Show running state
      entry.status = 'running';
      setResult({ attempts: [...attempts], finalStatus: 'running' });

      // Simulate the request (300ms execution)
      await new Promise(r => setTimeout(r, 300));
      if (runId !== runIdRef.current) return;

      // Determine success/failure
      const succeeded = Math.random() * 100 >= failureRate;
      entry.finishedAt = Date.now();

      if (succeeded) {
        entry.status = 'success';
        setResult({ attempts: [...attempts], finalStatus: 'success' });
        isRunningRef.current = false;
        return;
      }

      entry.status = 'failed';
      setResult({ attempts: [...attempts], finalStatus: attempt === MAX_RETRIES ? 'exhausted' : 'running' });
    }

    isRunningRef.current = false;
  }, [failureRate, jitterEnabled, maxDelayEnabled]);

  const reset = () => {
    runIdRef.current++;
    isRunningRef.current = false;
    setResult({ attempts: [], finalStatus: 'idle' });
  };

  // Calculate delay values for the chart
  const delaySchedule = Array.from({ length: MAX_RETRIES }, (_, i) => {
    let d = INITIAL_DELAY * Math.pow(2, i);
    if (maxDelayEnabled) d = Math.min(d, MAX_DELAY);
    return d;
  });
  const maxChartDelay = Math.max(...delaySchedule);

  const statusColor: Record<string, string> = {
    idle: 'var(--text-dim)',
    running: 'var(--info)',
    success: 'var(--accent)',
    exhausted: 'var(--danger)',
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <span className="category-tag">resilience</span>
        <h1>Retry with Exponential Backoff</h1>
        <p className="subtitle">Retry failed requests with progressively longer waits — {INITIAL_DELAY}ms, {INITIAL_DELAY * 2}ms, {INITIAL_DELAY * 4}ms…</p>
      </div>

      <div className="stats-row">
        <div className="stat">
          <span className="stat-label">Status</span>
          <span className="stat-value" style={{ color: statusColor[result.finalStatus] }}>
            {result.finalStatus === 'idle' ? 'IDLE' :
              result.finalStatus === 'running' ? 'RETRYING...' :
                result.finalStatus === 'success' ? 'SUCCESS' : 'EXHAUSTED'}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Attempts</span>
          <span className="stat-value">{result.attempts.length} / {MAX_RETRIES + 1}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Failure Rate</span>
          <span className="stat-value warning">{failureRate}%</span>
        </div>
      </div>

      <div className="viz-container">
        <div className="viz-controls">
          <button
            className="btn btn-accent"
            onClick={runSimulation}
            disabled={result.finalStatus === 'running'}
          >
            → Run Request
          </button>
          <button className="btn" onClick={reset}>Reset</button>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginLeft: 8 }}>
            <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={jitterEnabled}
                onChange={e => setJitterEnabled(e.target.checked)}
                style={{ accentColor: 'var(--accent)' }}
              />
              jitter
            </label>
            <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={maxDelayEnabled}
                onChange={e => setMaxDelayEnabled(e.target.checked)}
                style={{ accentColor: 'var(--accent)' }}
              />
              max delay ({MAX_DELAY}ms)
            </label>
          </div>
        </div>

        {/* Failure rate slider */}
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: 'var(--text-dim)', minWidth: 80 }}>fail rate: {failureRate}%</span>
          <input
            type="range"
            min={0}
            max={100}
            value={failureRate}
            onChange={e => setFailureRate(Number(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--danger)' }}
          />
        </div>

        {/* Backoff schedule chart */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>
            Backoff Schedule: delay = {INITIAL_DELAY}ms × 2<sup>attempt</sup>{maxDelayEnabled ? ` (capped at ${MAX_DELAY}ms)` : ''}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 100 }}>
            {/* Initial attempt (no delay) */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>0ms</span>
              <div style={{
                width: '100%',
                height: 4,
                background: 'var(--accent)',
                borderRadius: 'var(--radius)',
                transition: 'height 300ms ease',
              }} />
              <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>#0</span>
            </div>
            {delaySchedule.map((d, i) => {
              const attempt = result.attempts[i + 1];
              const barHeight = Math.max(4, (d / maxChartDelay) * 80);
              const isActive = attempt?.status === 'running';
              const isFailed = attempt?.status === 'failed';
              const isSuccess = attempt?.status === 'success';
              const actualDelay = attempt?.jitteredDelay;

              let barColor = 'var(--border-bright)';
              if (isActive) barColor = 'var(--info)';
              else if (isSuccess) barColor = 'var(--accent)';
              else if (isFailed) barColor = 'var(--danger)';
              else if (attempt) barColor = 'var(--text-dim)';

              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>
                    {actualDelay !== undefined ? `${Math.round(actualDelay)}ms` : `${d}ms`}
                  </span>
                  <div style={{
                    width: '100%',
                    height: barHeight,
                    background: barColor,
                    borderRadius: 'var(--radius)',
                    transition: 'height 300ms ease, background 300ms ease',
                    boxShadow: isActive ? `0 0 12px var(--info-glow)` : 'none',
                    position: 'relative',
                  }}>
                    {/* Jitter indicator — show reduced bar if jitter applied */}
                    {jitterEnabled && actualDelay !== undefined && actualDelay < d && (
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: Math.max(2, (actualDelay / maxChartDelay) * 80),
                        background: barColor,
                        borderRadius: 'var(--radius)',
                        opacity: 1,
                      }} />
                    )}
                  </div>
                  <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>#{i + 1}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Attempt timeline */}
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>
          Attempt Timeline
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {result.attempts.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-dim)', padding: '8px 0' }}>
              Click &quot;Run Request&quot; to start the retry simulation.
            </div>
          )}
          {result.attempts.map(a => {
            const attemptColor =
              a.status === 'success' ? 'var(--accent)' :
                a.status === 'failed' ? 'var(--danger)' :
                  a.status === 'running' ? 'var(--info)' : 'var(--text-dim)';

            return (
              <div key={a.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 12px',
                background: 'var(--bg)',
                border: `1px solid ${a.status === 'running' ? 'var(--info)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                transition: 'border-color 300ms ease, box-shadow 300ms ease',
                boxShadow: a.status === 'running' ? '0 0 12px var(--info-glow)' : 'none',
                animation: 'fadeIn 200ms ease',
              }}>
                {/* Attempt number */}
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  border: `1.5px solid ${attemptColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  color: attemptColor,
                  background: a.status === 'success' ? 'rgba(0,255,136,0.1)' :
                    a.status === 'failed' ? 'rgba(255,68,68,0.1)' :
                      a.status === 'running' ? 'rgba(68,136,255,0.1)' : 'transparent',
                  transition: 'all 300ms ease',
                  flexShrink: 0,
                }}>
                  {a.number}
                </div>

                {/* Status icon */}
                <div style={{ width: 16, textAlign: 'center', color: attemptColor, fontSize: 14 }}>
                  {a.status === 'success' ? '✓' :
                    a.status === 'failed' ? '✗' :
                      a.status === 'running' ? (
                        <span style={{ animation: 'pulse 0.8s ease-in-out infinite' }}>●</span>
                      ) : '○'}
                </div>

                {/* Details */}
                <div style={{ flex: 1, fontSize: 12 }}>
                  <span style={{ color: 'var(--text-bright)' }}>
                    {a.status === 'pending' ? 'Waiting...' :
                      a.status === 'running' ? 'Executing...' :
                        a.status === 'success' ? 'Succeeded!' :
                          `Failed`}
                  </span>
                  {a.number > 0 && (
                    <span style={{ color: 'var(--text-dim)', marginLeft: 8 }}>
                      waited {Math.round(a.jitteredDelay)}ms
                      {jitterEnabled && a.jitteredDelay !== a.delay && (
                        <span style={{ color: 'var(--warning)' }}> (jitter from {a.delay}ms)</span>
                      )}
                    </span>
                  )}
                </div>

                {/* Delay bar */}
                {a.number > 0 && (
                  <div style={{
                    width: 80,
                    height: 6,
                    background: 'var(--border)',
                    borderRadius: 3,
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(100, (a.jitteredDelay / maxChartDelay) * 100)}%`,
                      background: attemptColor,
                      borderRadius: 3,
                      transition: 'width 300ms ease',
                    }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Final result */}
        {result.finalStatus === 'success' && (
          <div style={{
            marginTop: 16,
            padding: '10px 16px',
            background: 'rgba(0,255,136,0.06)',
            border: '1px solid var(--accent)',
            borderRadius: 'var(--radius)',
            fontSize: 12,
            color: 'var(--accent)',
            animation: 'fadeIn 300ms ease',
          }}>
            ✓ Request succeeded on attempt #{result.attempts.findLast(a => a.status === 'success')?.number ?? 0}
          </div>
        )}
        {result.finalStatus === 'exhausted' && (
          <div style={{
            marginTop: 16,
            padding: '10px 16px',
            background: 'rgba(255,68,68,0.06)',
            border: '1px solid var(--danger)',
            borderRadius: 'var(--radius)',
            fontSize: 12,
            color: 'var(--danger)',
            animation: 'fadeIn 300ms ease',
          }}>
            ✗ All {MAX_RETRIES + 1} attempts exhausted — giving up
          </div>
        )}
      </div>

      <div className="info-columns">
        <div className="info-panel">
          <h3>// how it works</h3>
          <p style={{ marginBottom: 8 }}>
            When a request fails, retry with increasing wait times:
          </p>
          <ul>
            <li>Attempt 0: immediate (no delay)</li>
            <li>Retry 1: wait {INITIAL_DELAY}ms</li>
            <li>Retry 2: wait {INITIAL_DELAY * 2}ms</li>
            <li>Retry N: wait initialDelay × 2<sup>N-1</sup></li>
            <li>Optional: cap delay at maxDelayMs</li>
            <li>Optional: add jitter (random × delay) to avoid thundering herd</li>
            <li>If all retries fail → throw the last error</li>
          </ul>
        </div>

        <div className="info-panel">
          <h3>// trade-offs</h3>
          <ul>
            <li>Handles transient failures automatically</li>
            <li>Exponential growth prevents overwhelming the service</li>
            <li>Jitter spreads retries to avoid synchronized storms</li>
            <li className="con">Adds latency — total wait can grow fast</li>
            <li className="con">Not suitable for non-idempotent operations (different results on retry)</li>
            <li className="con">Can mask persistent failures if maxRetries is too high</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
