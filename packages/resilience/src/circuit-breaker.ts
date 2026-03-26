export enum CircuitState {
  CLOSED = "CLOSED", // Normal operation. Requests flow freely.
  OPEN = "OPEN", // Requests immediately fail fast.
  HALF_OPEN = "HALF_OPEN", // Testing if the service is back up.
}

export interface CircuitBreakerOptions {
  failureThreshold: number; // Max consecutive failures before opening the circuit
  resetTimeoutMs: number; // Time to wait before entering HALF_OPEN state
}

/**
 * IMPLEMENTATION CHALLENGE: CIRCUIT BREAKER
 *
 * Concept:
 * - A Circuit Breaker acts like an electrical switch to prevent a failing service from being overwhelmed.
 * - CLOSED: Let all requests pass. If a request throws an error, increment failure count. If failure count >= threshold, switch to OPEN. If request succeeds, reset failure count to 0.
 * - OPEN: Immediately reject all requests (throw an error: "Circuit is OPEN"). Start a timer. After `resetTimeoutMs`, switch to HALF_OPEN.
 * - HALF_OPEN: Let ONE request pass to see if the service recovered.
 *    - If it succeeds: the service is fixed! Switch back to CLOSED (reset failures tracking).
 *    - If it fails: the service is still broken. Switch back to OPEN and restart the timer.
 *
 * YOUR TASK:
 * 1. Track the current state (`this.state`).
 * 2. Track the number of consecutive failures (`this.consecutiveFailures`).
 * 3. Track when the circuit was opened (`this.nextAttemptTime`).
 * 4. Implement the logic to transition between these 3 states based on failures and time!
 */

export class CircuitBreaker {
  private options: CircuitBreakerOptions;

  private state: CircuitState = CircuitState.CLOSED;
  private consecutiveFailures: number = 0;
  private nextAttemptTime: number = 0;
  private probeInFlight: boolean = false;

  constructor(options: CircuitBreakerOptions) {
    this.options = options;
  }

  public getState(): CircuitState {
    const now = Date.now();
    if (this.state === CircuitState.OPEN && now >= this.nextAttemptTime)
      this.state = CircuitState.HALF_OPEN;
    return this.state;
  }

  async execute<T>(action: () => Promise<T>): Promise<T> {
    const currentState = this.getState();
    if (currentState == CircuitState.HALF_OPEN) {
      if (this.probeInFlight)
        return Promise.reject(
          new Error("Probe request already in processing.."),
        );
      else this.probeInFlight = true;
    }
    const now = Date.now();
    if (currentState === CircuitState.OPEN) throw new Error("Circuit is OPEN");
    try {
      const response = await action();
      if (currentState == CircuitState.HALF_OPEN) {
        this.state = CircuitState.CLOSED;
        this.probeInFlight = false;
      }
      if (this.consecutiveFailures) this.consecutiveFailures = 0;
      return Promise.resolve(response);
    } catch (error) {
      this.consecutiveFailures++;
      if (currentState == CircuitState.HALF_OPEN) {
        this.state = CircuitState.OPEN;
        this.nextAttemptTime = now + this.options.resetTimeoutMs;
        this.probeInFlight = false;
      } else if (
        currentState == CircuitState.CLOSED &&
        this.consecutiveFailures >= this.options.failureThreshold
      ) {
        this.state = CircuitState.OPEN;
        this.nextAttemptTime = now + this.options.resetTimeoutMs;
        this.consecutiveFailures = 0;
      }
      return Promise.reject(error);
    }
  }
}
