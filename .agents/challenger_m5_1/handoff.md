# Adversarial Empirical Challenge Report — Milestone 5 (E2E Integration & Verification)

## Challenge Summary

**Overall risk assessment**: **CRITICAL**
**Final Verdict**: **REQUEST_CHANGES**

Empirical stress testing of the master test runner (`tests/runner.js`) and core execution harness (`tests/common/harness.js`) revealed 6 confirmed defects, including a **critical regulatory invariant bypass** where offline synchronization duplicates are falsely evaluated as passing, a **regex filter malfunction**, **exit code anomalies on invalid tier inputs**, **dangling timer memory leaks**, and **broken summary metrics under bail mode**.

---

## Stress Test Results Matrix

| Scenario / Flag | Tested Input | Expected Behavior | Actual Behavior | Result |
|---|---|---|---|:---:|
| **Nominal Run** | `node tests/runner.js` | Runs all 5 tiers (213 tests), passes all 4 invariants | 213 tests passed, exit code 0 | **PASS** |
| **Tier Selection** | `node tests/runner.js --tier=1` | Runs 90 Tier 1 tests only | 90 tests run, Tier 1=90, others=0 | **PASS** |
| **Multi-Tier** | `node tests/runner.js -t 1,3` | Runs Tier 1 (90) + Tier 3 (20) = 110 tests | 110 tests run, exit code 0 | **PASS** |
| **Suite Filter** | `node tests/runner.js --suite=f01` | Runs only F01 suite files across selected tiers | 5 tests in Tier 1 F01 executed | **PASS** |
| **JSON Output** | `node tests/runner.js --tier=5 --json` | Outputs parseable JSON to stdout with exit code 0 | Valid JSON produced, no stdout noise | **PASS** |
| **JSON File Output** | `node tests/runner.js --tier=5 --json-file=/tmp/rep.json` | Writes report to disk | File created with valid schema | **PASS** |
| **Assertion Failure Exit**| Temporary failing assertion | Exit Code 1, failure details reported | Exit Code 1, error captured | **PASS** |
| **Syntax/Import Error** | Malformed JS test file | Exit Code 2 (runner/file error) | Exit Code 2 | **PASS** |
| **Inv 1: Ledger Imbalance**| Debit != Credit | Exit Code 3, Invariant 1 fails | Exit Code 3, `allInvariantsPassed: false` | **PASS** |
| **Inv 2: Voice Latency** | Latency > 2000ms | Exit Code 3, Invariant 2 fails | Exit Code 3, `allInvariantsPassed: false` | **PASS** |
| **Inv 4: Usury Rate** | Loan APR > 27.0% allowed | Exit Code 3, Invariant 4 fails | Exit Code 3, `allInvariantsPassed: false` | **PASS** |
| **Timeout Flag** | `--timeout=50` with slow async test | Fails with timeout error, Exit Code 1 | Fails with timeout error, Exit Code 1 | **PASS** |
| **Inv 3: Sync Duplicates**| `recordSyncReplay(true)` (duplicate) | Exit Code 3, Invariant 3 fails | **Exit Code 0, Invariant 3 PASSED** | **FAIL (BUG 1)** |
| **Filter Regex Pattern** | `--filter="^SYSCOA\|9-[Cc]lass"` | Matches regex test names | **0 matched, all 90 skipped** | **FAIL (BUG 2)** |
| **Invalid / Non-Existent Tier** | `node tests/runner.js --tier=99` | Exit Code 2 (invalid argument/discovery) | **Exit Code 0 (silent pass)** | **FAIL (BUG 3)** |
| **Unknown Argument** | `node tests/runner.js --foobar` | Exit Code 2 (unrecognized argument) | **Exit Code 0 (ignored)** | **FAIL (BUG 3)** |
| **Timer Cleanup on Fail**| Failing test with timeout | Clear timeout immediately on rejection | **Timer left dangling in Node loop** | **FAIL (BUG 4)** |
| **Bail Output & Metrics** | `--bail -v` / `--bail --json` | Record failed suite, single log output | **Summary stats wiped (total:0), log doubled** | **FAIL (BUG 5)** |
| **Non-Numeric Timeout** | `--timeout=abc` | Exit Code 2 on bad argument | **Sets timeout to NaN, breaks async tests** | **FAIL (BUG 6)** |

---

## Detailed Challenges & Vulnerabilities

### [Critical] Challenge 1: Invariant 3 Idempotency Invalidation Logic Bypass
- **File & Line**: `tests/runner.js:196`
- **Assumption Challenged**: The test runner enforces zero-duplicate offline synchronization through Invariant 3 (`INV_03_SYNC_IDEMPOTENCY`).
- **Observed Code**:
  ```javascript
  // Invariant 3: Offline Sync Idempotency (Zero Duplicate Ledger Postings)
  const syncIdempotent = inv.replayDuplicatesCount === 0 || inv.replaysTested > 0;
  ```
- **Attack Scenario**: An offline sync test discovers duplicate transactions upon replay (`replayDuplicatesCount = 5`, `replaysTested = 5`). Because `inv.replaysTested > 0` evaluates to `true`, the logical OR `||` evaluates `syncIdempotent = true`.
- **Empirical Reproduction**:
  ```bash
  node -e '
  import { harness } from "./tests/common/harness.js";
  harness.invariants.replayDuplicatesCount = 10;
  harness.invariants.replaysTested = 10;
  const syncIdempotent = harness.invariants.replayDuplicatesCount === 0 || harness.invariants.replaysTested > 0;
  console.log("Result (expected false, got):", syncIdempotent);
  '
  # Output: Result (expected false, got): true
  ```
- **Blast Radius**: Regulatory invariant violation is completely masked. A build producing duplicate financial transactions will exit with status 0 and report `[PASS]`.
- **Mitigation**: Change line 196 to:
  ```javascript
  const syncIdempotent = inv.replayDuplicatesCount === 0;
  ```

---

### [High] Challenge 2: CLI `--filter` Regex Evaluation Breakdown
- **File & Line**: `tests/runner.js:280-282`
- **Assumption Challenged**: The `--filter <pattern>` flag supports regular expressions as advertised in the CLI help manual (`Filter individual test case names by regex or string`) and project requirements.
- **Observed Code**:
  ```javascript
  const filterFn = options.filterPattern
    ? (testName, suiteName) => testName.toLowerCase().includes(options.filterPattern.toLowerCase()) || suiteName.toLowerCase().includes(options.filterPattern.toLowerCase())
    : null;
  ```
- **Attack Scenario**: User runs `node tests/runner.js --filter="^Tier 1"` or `node tests/runner.js --filter="F0[1-3]|F05"`. Because `includes()` treats regex syntax as literal string characters, all matching tests are skipped (0 tests executed, summary reports 100% skipped).
- **Empirical Reproduction**:
  ```bash
  node tests/runner.js --tier=1 --suite=f01 --filter="^SYSCOA|9-[Cc]lass" --json
  # Output: "passed": 0, "skipped": 5
  ```
- **Blast Radius**: Developers and CI pipelines cannot filter tests by pattern, leading to false green runs where 0 tests actually execute.
- **Mitigation**: Parse `options.filterPattern` into a `RegExp` with try/catch fallback:
  ```javascript
  let filterRegex = null;
  if (options.filterPattern) {
    try {
      filterRegex = new RegExp(options.filterPattern, 'i');
    } catch (e) {
      console.error(`Invalid filter regex pattern: ${options.filterPattern}`);
      process.exit(2);
    }
  }
  const filterFn = filterRegex
    ? (testName, suiteName) => filterRegex.test(testName) || filterRegex.test(suiteName)
    : null;
  ```

---

### [Medium] Challenge 3: Exit Code 0 on Invalid Tiers & Unrecognized CLI Arguments
- **File & Line**: `tests/runner.js:239-244`, `tests/runner.js:45-98`
- **Assumption Challenged**: Invalid arguments and non-existent tiers exit with Exit Code 2 as specified in runner documentation:
  `2: Runner/CLI crash or file discovery error.`
- **Observed Code**:
  ```javascript
  const testFiles = discoverTestFiles(options);
  if (testFiles.length === 0) {
    if (!options.quiet && !options.json) {
      console.log(`${C.yellow}⚠ No test files matched the specified criteria.${C.reset}`);
    }
    process.exit(0);
  }
  ```
- **Attack Scenario**:
  1. A typo in CI script: `node tests/runner.js --tier=99` or `--tier=nonexistent`.
  2. An unrecognized flag: `node tests/runner.js --unknown-flag`.
- **Empirical Reproduction**:
  ```bash
  node tests/runner.js --tier=99
  echo "Exit: $?"
  # Output: ⚠ No test files matched the specified criteria. Exit: 0
  ```
- **Blast Radius**: CI pipelines will report successful builds when invalid arguments are provided and zero tests are executed.
- **Mitigation**:
  1. Validate that all tiers in `options.tiers` belong to `['1', '2', '3', '4', '5']`. If not, print error and exit 2.
  2. In `parseArgs()`, reject unrecognized flags with an error message and exit 2.

---

### [Medium] Challenge 4: Dangling Timeout Timer Leak in Harness on Test Rejection
- **File & Line**: `tests/common/harness.js:156-170`
- **Assumption Challenged**: Async timeouts are safely cleared upon completion of every test case.
- **Observed Code**:
  ```javascript
  try {
    let timeoutHandle;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error(`Test timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    await Promise.race([
      Promise.resolve(testCase.fn()),
      timeoutPromise
    ]);

    clearTimeout(timeoutHandle);
    testCase.status = 'PASSED';
    suite.passed++;
    this.stats.passed++;
  } catch (err) {
    ...
  }
  ```
- **Attack Scenario**: A test throws an assertion error synchronously or rejects after 10ms. Because execution jumps straight to `catch (err)`, `clearTimeout(timeoutHandle)` is skipped. The 5000ms timer stays active on the Node.js event loop.
- **Empirical Reproduction**: When catching errors in isolated test runs, the dangling timer fires 5000ms later with `Error: Test timed out after 5000ms`.
- **Blast Radius**: Unnecessary event loop retention, risk of unhandled rejections if promises are monitored, and delayed process termination in test frameworks.
- **Mitigation**: Move `let timeoutHandle;` above the `try` block and ensure `clearTimeout(timeoutHandle)` is always executed in `finally`.

---

### [Medium] Challenge 5: Broken Summary Statistics & Double Logging under `--bail`
- **File & Line**: `tests/common/harness.js:177-192`, `tests/runner.js:303-338`
- **Assumption Challenged**: When `--bail` halts execution, the failing test is captured in the execution summary, stats, and JSON report.
- **Observed Behavior**:
  1. In `harness.js`: `onTestComplete` is called in `catch (err)` AND subsequently called in `finally`, resulting in duplicate console logs in `-v` mode.
  2. In `runner.js`: `await harness.runSuite(...)` throws due to `bail`, jumping to `catch (err)` on line 330. As a result, lines 303-328 (which update `tierStats` and push to `allSuitesResults`) are skipped.
- **Empirical Reproduction**:
  ```bash
  # Run a failing test with --bail --json
  # Result in JSON summary: "total": 0, "passed": 0, "failed": 0, "suites": []
  ```
- **Blast Radius**: Automated CI systems parsing JSON reports receive empty suite lists and 0 total tests despite an actual test failure.
- **Mitigation**: Catch bail inside `runSuite` or ensure `allSuitesResults` and `tierStats` record the partially executed suite and the failing test before halting. Remove duplicate `onTestComplete` invocation from `harness.js` catch block.

---

### [Low] Challenge 6: Non-Numeric `--timeout` Parameter Ingestion
- **File & Line**: `tests/runner.js:90-93`
- **Assumption Challenged**: CLI arguments are validated for type correctness.
- **Observed Behavior**: `--timeout=abc` produces `NaN`. In `harness.js`, `setTimeout(fn, NaN)` sets a ~1ms timeout, causing all async tests to fail immediately with `Test timed out after NaNms` and exit code 1.
- **Empirical Reproduction**:
  ```bash
  node tests/runner.js --tier=5 --suite=test_f16 --timeout=abc
  # Output: ✗ async delay: Test timed out after NaNms
  ```
- **Mitigation**: Validate `Number.isInteger(options.timeout) && options.timeout > 0`, otherwise print usage error and exit 2.

---

## 5-Component Handoff Report

### 1. Observation
- **Observation 1 (Invariant 3)**: In `tests/runner.js:196`, `const syncIdempotent = inv.replayDuplicatesCount === 0 || inv.replaysTested > 0;`. When simulated with `replayDuplicatesCount = 10, replaysTested = 10`, `syncIdempotent` returned `true`, resulting in `allInvariantsPassed: true` and exit code 0.
- **Observation 2 (Filter Regex)**: In `tests/runner.js:280-282`, `filterFn` executes `testName.toLowerCase().includes(options.filterPattern.toLowerCase())`. Running `node tests/runner.js --tier=1 --suite=f01 --filter="^SYSCOA|9-[Cc]lass"` resulted in 0 passed and 5 skipped tests.
- **Observation 3 (Exit Codes on Invalid Args)**: In `tests/runner.js:239-244`, `node tests/runner.js --tier=99` and `node tests/runner.js --tier=foo` exited with status code `0` instead of `2`.
- **Observation 4 (Dangling Timer)**: In `tests/common/harness.js:168`, `clearTimeout(timeoutHandle)` is only called on the success path inside `try`. An assertion error triggers an uncaught timeout rejection 5000ms later.
- **Observation 5 (Bail Summary)**: In `tests/runner.js:330`, when `harness.runSuite` throws on `--bail`, `tierStats` is never incremented. Running `--bail --json` on a failing test produces `"total": 0, "failed": 0, "suites": []` and prints error messages twice in `-v` mode.
- **Observation 6 (Timeout NaN)**: In `tests/runner.js:90-93`, `--timeout=abc` is parsed as `NaN` and causes `Test timed out after NaNms`.

### 2. Logic Chain
1. The test runner exists to provide regulatory assurance for banking operations (SYSCOA-SFD balance, BCEAO usury ceiling, and offline sync idempotency).
2. If the invariant calculation contains `|| inv.replaysTested > 0`, any sync suite testing replays will pass even with massive data corruption / duplication.
3. If `--filter` does not support regex, developers and automated sub-tier test scripts will silently skip tests.
4. If non-existent tiers exit with 0, CI builds with configuration errors will report false passes.
5. If `--bail` wipes test suite records from the JSON artifact, observability into which test caused the bail is destroyed.
6. Therefore, the runner requires immediate bug fixes before the test suite can be certified for Milestone 5.

### 3. Caveats
- Tests were executed on Linux x86_64 with Node.js v24.18.0.
- All existing 213 unit/integration tests across Tiers 1–5 pass under normal nominal execution (`node tests/runner.js` -> 213/213 passed, exit 0). The issues identified are specific to runner CLI flags, error paths, invariant audit logic, and edge-case execution modes.

### 4. Conclusion
The implementation of `tests/runner.js` and `tests/common/harness.js` contains 6 distinct defects (1 Critical, 1 High, 3 Medium, 1 Low). Most critically, Invariant 3 fails to detect sync duplicates.
**Verdict**: **`REQUEST_CHANGES`**.

### 5. Verification Method
To independently verify all findings, run the following commands:
1. **Invariant 3 Bug**:
   ```bash
   node -e '
   import { harness } from "./tests/common/harness.js";
   harness.invariants.replayDuplicatesCount = 1;
   harness.invariants.replaysTested = 1;
   const syncIdempotent = harness.invariants.replayDuplicatesCount === 0 || harness.invariants.replaysTested > 0;
   console.log("Bug confirmed if true:", syncIdempotent);
   '
   ```
2. **Regex Filter Bug**:
   ```bash
   node tests/runner.js --tier=1 --suite=f01 --filter="^SYSCOA|9-[Cc]lass" --json
   ```
3. **Invalid Tier Exit Code Bug**:
   ```bash
   node tests/runner.js --tier=99
   echo "Exit Code: $?"
   ```
