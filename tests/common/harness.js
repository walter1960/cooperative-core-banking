/**
 * BANOLIA Zero-Dependency Micro Test Harness
 * Pure Node.js test execution engine with async hooks, timeouts, and invariant telemetry.
 */

import { performance } from 'node:perf_hooks';

class TestHarness {
  constructor() {
    this.suites = [];
    this.currentSuite = null;
    this.stats = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      durationMs: 0
    };
    this.invariants = {
      totalDebits: 0,
      totalCredits: 0,
      ledgerBalanced: true,
      maxVoiceLatencyMs: 0,
      voiceCallsCount: 0,
      replaysTested: 0,
      replayDuplicatesCount: 0,
      usuryChecksPassed: true,
      highestInterestRateChecked: 0
    };
  }

  reset() {
    this.suites = [];
    this.currentSuite = null;
    this.stats = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      durationMs: 0
    };
  }

  describe(name, fn) {
    const suite = {
      name,
      tests: [],
      beforeAll: [],
      afterAll: [],
      beforeEach: [],
      afterEach: [],
      durationMs: 0,
      passed: 0,
      failed: 0,
      skipped: 0
    };
    this.suites.push(suite);
    const prev = this.currentSuite;
    this.currentSuite = suite;
    fn();
    this.currentSuite = prev;
  }

  test(name, fn, options = {}) {
    if (!this.currentSuite) {
      this.describe('Default Suite', () => {});
    }
    const testCase = {
      name,
      fn,
      options,
      status: 'PENDING',
      durationMs: 0,
      error: null
    };
    this.currentSuite.tests.push(testCase);
    this.stats.total++;
  }

  it(name, fn, options = {}) {
    this.test(name, fn, options);
  }

  beforeAll(fn) {
    if (this.currentSuite) this.currentSuite.beforeAll.push(fn);
  }

  afterAll(fn) {
    if (this.currentSuite) this.currentSuite.afterAll.push(fn);
  }

  beforeEach(fn) {
    if (this.currentSuite) this.currentSuite.beforeEach.push(fn);
  }

  afterEach(fn) {
    if (this.currentSuite) this.currentSuite.afterEach.push(fn);
  }

  recordLedgerEntry(debit, credit) {
    this.invariants.totalDebits += debit;
    this.invariants.totalCredits += credit;
    if (Math.abs(this.invariants.totalDebits - this.invariants.totalCredits) > 0.01) {
      this.invariants.ledgerBalanced = false;
    }
  }

  recordVoiceLatency(latencyMs) {
    this.invariants.voiceCallsCount++;
    if (latencyMs > this.invariants.maxVoiceLatencyMs) {
      this.invariants.maxVoiceLatencyMs = latencyMs;
    }
  }

  recordSyncReplay(isDuplicate) {
    this.invariants.replaysTested++;
    if (isDuplicate) {
      this.invariants.replayDuplicatesCount++;
    }
  }

  recordUsuryRate(rate, isAllowed) {
    if (rate > this.invariants.highestInterestRateChecked) {
      this.invariants.highestInterestRateChecked = rate;
    }
    if (rate > 27.0 && isAllowed) {
      this.invariants.usuryChecksPassed = false;
    }
  }

  async runSuite(suite, options = {}) {
    const { filterFn, bail = false, defaultTimeout = 5000, onTestComplete } = options;
    const suiteStart = performance.now();

    for (const hook of suite.beforeAll) {
      await hook();
    }

    let bailedError = null;

    for (const testCase of suite.tests) {
      if (filterFn && !filterFn(testCase.name, suite.name)) {
        testCase.status = 'SKIPPED';
        suite.skipped++;
        this.stats.skipped++;
        if (onTestComplete) onTestComplete(testCase, suite);
        continue;
      }

      for (const hook of suite.beforeEach) {
        await hook();
      }

      const start = performance.now();
      const timeoutMs = testCase.options.timeout || defaultTimeout;
      let timeoutHandle;

      try {
        const timeoutPromise = new Promise((_, reject) => {
          timeoutHandle = setTimeout(() => {
            reject(new Error(`Test timed out after ${timeoutMs}ms`));
          }, timeoutMs);
        });

        await Promise.race([
          Promise.resolve(testCase.fn()),
          timeoutPromise
        ]);

        testCase.status = 'PASSED';
        suite.passed++;
        this.stats.passed++;
      } catch (err) {
        testCase.status = 'FAILED';
        testCase.error = err;
        suite.failed++;
        this.stats.failed++;
        if (bail) {
          bailedError = err;
        }
      } finally {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }
        testCase.durationMs = Math.round(performance.now() - start);
        for (const hook of suite.afterEach) {
          try {
            await hook();
          } catch (e) {
            console.error('Error in afterEach hook:', e);
          }
        }
        if (onTestComplete) onTestComplete(testCase, suite);
      }

      if (bailedError) {
        break;
      }
    }

    for (const hook of suite.afterAll) {
      try {
        await hook();
      } catch (e) {
        console.error('Error in afterAll hook:', e);
      }
    }

    suite.durationMs = Math.round(performance.now() - suiteStart);
    if (bailedError) {
      const bailErr = new Error(`Bail triggered by test failure: ${bailedError.message || bailedError}`);
      bailErr.isBail = true;
      bailErr.suite = suite;
      bailErr.originalError = bailedError;
      throw bailErr;
    }
    return suite;
  }
}

export const harness = new TestHarness();
export const describe = harness.describe.bind(harness);
export const test = harness.test.bind(harness);
export const it = harness.it.bind(harness);
export const beforeAll = harness.beforeAll.bind(harness);
export const afterAll = harness.afterAll.bind(harness);
export const beforeEach = harness.beforeEach.bind(harness);
export const afterEach = harness.afterEach.bind(harness);
export default harness;
