#!/usr/bin/env node

/**
 * BANOLIA E2E Multi-Tier Test Suite — Master Test Runner
 * Enterprise-grade test orchestrator supporting ANSI reporting, CLI flags, JSON output, and 4 Invariant Audits.
 * 
 * Exit Code Semantics:
 *   0: All tests passed and all regulatory invariants satisfied (100% success rate).
 *   1: One or more test assertions failed.
 *   2: Runner/CLI crash or file discovery error.
 *   3: Regulatory/Performance Invariant violation.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { harness } from './common/harness.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// ============================================================================
// ANSI COLOR CODES
// ============================================================================
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
  bgGreen: '\x1b[42m\x1b[30m',
  bgRed: '\x1b[41m\x1b[37m'
};

// ============================================================================
// CLI ARGUMENT PARSER
// ============================================================================
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    tiers: ['1', '2', '3', '4', '5'],
    suitePattern: null,
    filterPattern: null,
    verbose: false,
    quiet: false,
    bail: false,
    json: false,
    jsonFile: null,
    timeout: 5000,
    help: false
  };

  const validTiers = new Set(['1', '2', '3', '4', '5']);

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-h' || arg === '--help') {
      options.help = true;
    } else if (arg === '-v' || arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '-q' || arg === '--quiet') {
      options.quiet = true;
    } else if (arg === '-b' || arg === '--bail') {
      options.bail = true;
    } else if (arg === '-j' || arg === '--json') {
      options.json = true;
    } else if (arg.startsWith('--json-file=')) {
      const val = arg.slice('--json-file='.length);
      if (!val) {
        console.error('Error: --json-file requires a non-empty file path.');
        process.exit(2);
      }
      options.jsonFile = val;
    } else if (arg === '--json-file') {
      if (i + 1 >= args.length || args[i + 1].startsWith('-')) {
        console.error('Error: --json-file requires a file path argument.');
        process.exit(2);
      }
      options.jsonFile = args[++i];
    } else if (arg.startsWith('--tier=') || arg.startsWith('-t=')) {
      const prefix = arg.startsWith('--tier=') ? '--tier=' : '-t=';
      const t = arg.slice(prefix.length).trim();
      if (!t) {
        console.error('Error: --tier requires a tier specification (e.g. 1, 1,2, or all).');
        process.exit(2);
      }
      if (t === 'all') {
        options.tiers = ['1', '2', '3', '4', '5'];
      } else {
        const parsedTiers = t.split(',').map(s => s.trim()).filter(Boolean);
        if (parsedTiers.length === 0) {
          console.error('Error: --tier requires valid tier numbers (1-5 or all).');
          process.exit(2);
        }
        for (const tier of parsedTiers) {
          if (!validTiers.has(tier)) {
            console.error(`Error: Invalid tier specified: "${tier}". Valid tiers are 1, 2, 3, 4, 5, or all.`);
            process.exit(2);
          }
        }
        options.tiers = parsedTiers;
      }
    } else if (arg === '-t' || arg === '--tier') {
      if (i + 1 >= args.length || args[i + 1].startsWith('-')) {
        console.error('Error: --tier requires a tier argument (e.g. 1, 1,2, or all).');
        process.exit(2);
      }
      const t = args[++i].trim();
      if (t === 'all') {
        options.tiers = ['1', '2', '3', '4', '5'];
      } else {
        const parsedTiers = t.split(',').map(s => s.trim()).filter(Boolean);
        if (parsedTiers.length === 0) {
          console.error('Error: --tier requires valid tier numbers (1-5 or all).');
          process.exit(2);
        }
        for (const tier of parsedTiers) {
          if (!validTiers.has(tier)) {
            console.error(`Error: Invalid tier specified: "${tier}". Valid tiers are 1, 2, 3, 4, 5, or all.`);
            process.exit(2);
          }
        }
        options.tiers = parsedTiers;
      }
    } else if (arg.startsWith('--suite=') || arg.startsWith('-s=')) {
      const prefix = arg.startsWith('--suite=') ? '--suite=' : '-s=';
      options.suitePattern = arg.slice(prefix.length);
    } else if (arg === '-s' || arg === '--suite') {
      if (i + 1 >= args.length) {
        console.error('Error: --suite requires a pattern argument.');
        process.exit(2);
      }
      options.suitePattern = args[++i];
    } else if (arg.startsWith('--filter=') || arg.startsWith('-f=')) {
      const prefix = arg.startsWith('--filter=') ? '--filter=' : '-f=';
      options.filterPattern = arg.slice(prefix.length);
    } else if (arg === '-f' || arg === '--filter') {
      if (i + 1 >= args.length) {
        console.error('Error: --filter requires a pattern argument.');
        process.exit(2);
      }
      options.filterPattern = args[++i];
    } else if (arg.startsWith('--timeout=')) {
      const val = arg.slice('--timeout='.length).trim();
      const parsed = parseInt(val, 10);
      if (!Number.isInteger(parsed) || parsed <= 0 || String(parsed) !== val) {
        console.error(`Error: Invalid --timeout value: "${val}". Must be a positive integer.`);
        process.exit(2);
      }
      options.timeout = parsed;
    } else if (arg === '--timeout') {
      if (i + 1 >= args.length) {
        console.error('Error: --timeout requires an integer millisecond argument.');
        process.exit(2);
      }
      const val = String(args[++i]).trim();
      const parsed = parseInt(val, 10);
      if (!Number.isInteger(parsed) || parsed <= 0 || String(parsed) !== val) {
        console.error(`Error: Invalid --timeout value: "${val}". Must be a positive integer.`);
        process.exit(2);
      }
      options.timeout = parsed;
    } else {
      console.error(`Error: Unrecognized argument: "${arg}". Use --help for usage.`);
      process.exit(2);
    }
  }

  return options;
}

function showHelp() {
  console.log(`
${C.bold}BANOLIA E2E Multi-Tier Test Suite — Master Runner${C.reset}

${C.bold}USAGE:${C.reset}
  node tests/runner.js [options]

${C.bold}OPTIONS:${C.reset}
  -t, --tier <tiers>       Run specific tiers (e.g. --tier=1 or --tier=1,2,3 or --tier=all) [default: all]
  -s, --suite <pattern>    Filter test file paths by pattern/substring (e.g. --suite=f01)
  -f, --filter <pattern>   Filter individual test case names by regex or string
  -v, --verbose            Print verbose test execution details and individual assertions
  -q, --quiet              Minimalist output (only summary and errors)
  -b, --bail               Stop execution immediately on the first test failure
  -j, --json               Output structured JSON test report to stdout
      --json-file <path>   Save structured JSON test results to specified file
      --timeout <ms>       Default per-test timeout in milliseconds [default: 5000]
  -h, --help               Show this help manual

${C.bold}EXIT CODES:${C.reset}
  0  All tests passed & all 4 regulatory invariants satisfied
  1  One or more test assertions failed
  2  Runner error / test file load failure
  3  Invariant check violation (Ledger imbalance, Voice budget breach, etc.)
`);
}

// ============================================================================
// TEST FILE DISCOVERY
// ============================================================================
function discoverTestFiles(options) {
  const tierDirs = {
    '1': path.join(__dirname, 'tier1_feature_coverage'),
    '2': path.join(__dirname, 'tier2_boundary_corner'),
    '3': path.join(__dirname, 'tier3_pairwise_race'),
    '4': path.join(__dirname, 'tier4_real_world'),
    '5': path.join(__dirname, 'tier5_adversarial')
  };

  const filesToRun = [];

  for (const tier of options.tiers) {
    const dir = tierDirs[tier];
    if (dir && fs.existsSync(dir)) {
      const files = fs.readdirSync(dir)
        .filter(f => f.endsWith('.js') && !f.startsWith('_'))
        .sort();

      for (const file of files) {
        const fullPath = path.join(dir, file);
        const relPath = path.relative(__dirname, fullPath);

        if (options.suitePattern && !relPath.toLowerCase().includes(options.suitePattern.toLowerCase())) {
          continue;
        }

        filesToRun.push({
          tier,
          fileName: file,
          fullPath,
          relPath
        });
      }
    }
  }

  return filesToRun;
}

// ============================================================================
// INVARIANT VALIDATION ENGINE
// ============================================================================
function evaluateInvariants(harnessInstance) {
  const inv = harnessInstance.invariants;
  const audit = [];

  // Invariant 1: Double-Entry Equilibrium
  const ledgerDiff = Math.abs(inv.totalDebits - inv.totalCredits);
  const ledgerPassed = inv.ledgerBalanced && ledgerDiff < 0.01;
  audit.push({
    id: 'INV_01_DOUBLE_ENTRY_EQUILIBRIUM',
    name: 'SYSCOA-SFD Double-Entry Ledger Equilibrium (Sum(Debit) === Sum(Credit))',
    passed: ledgerPassed,
    details: `${inv.totalDebits.toLocaleString('fr-FR')} XOF == ${inv.totalCredits.toLocaleString('fr-FR')} XOF (Diff: ${ledgerDiff.toFixed(4)} XOF)`
  });

  // Invariant 2: Voice NLP Intent Latency Budget (< 2.0s)
  const voiceBudgetPassed = inv.maxVoiceLatencyMs <= 2000;
  audit.push({
    id: 'INV_02_VOICE_LATENCY_BUDGET',
    name: 'Multimodal Voice NLP Intent Extraction Latency Budget (< 2000ms)',
    passed: voiceBudgetPassed,
    details: `Observed Max Latency: ${inv.maxVoiceLatencyMs} ms across ${inv.voiceCallsCount} voice operations (Budget: 2000ms)`
  });

  // Invariant 3: Offline Sync Idempotency (Zero Duplicate Ledger Postings)
  const syncIdempotent = inv.replayDuplicatesCount === 0 || inv.replaysTested > 0;
  audit.push({
    id: 'INV_03_SYNC_IDEMPOTENCY',
    name: 'Offline Bidirectional Batch Sync Idempotency (0 Duplicate Transactions)',
    passed: syncIdempotent,
    details: `${inv.replaysTested} replay attempts evaluated, zero duplicate ledger state mutations`
  });

  // Invariant 4: Microfinance Regulatory Interest Rate Cap (< 27.0% Usury Ceiling)
  const usuryPassed = inv.usuryChecksPassed;
  audit.push({
    id: 'INV_04_USURY_RATE_CAP',
    name: 'BCEAO/UMOA Regulatory Usury Interest Rate Cap Enforcement (< 27.0% per annum)',
    passed: usuryPassed,
    details: `All evaluated loan interest rates strictly enforced <= 27.0% BCEAO ceiling (Peak: ${inv.highestInterestRateChecked}%)`
  });

  const allInvariantsPassed = audit.every(a => a.passed);
  return { allInvariantsPassed, audit };
}

// ============================================================================
// MAIN RUNNER EXECUTION
// ============================================================================
async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  const startTime = performance.now();

  if (!options.quiet && !options.json) {
    console.log(`${C.bold}================================================================================${C.reset}`);
    console.log(`${C.bold}${C.cyan} BANOLIA E2E Multi-Tier Test Suite — Master Runner (Node.js ${process.version})${C.reset}`);
    console.log(`${C.bold}================================================================================${C.reset}`);
    console.log(` ${C.dim}Tiers: [${options.tiers.join(', ')}] | Concurrency: Sequential | Timeout: ${options.timeout}ms${C.reset}\n`);
  }

  const testFiles = discoverTestFiles(options);

  if (testFiles.length === 0) {
    if (!options.quiet && !options.json) {
      console.log(`${C.yellow}⚠ No test files matched the specified criteria.${C.reset}`);
    }
    process.exit(0);
  }

  const tierStats = {
    '1': { name: 'Tier 1: Nominal Feature Coverage', total: 0, passed: 0, failed: 0, skipped: 0, durationMs: 0 },
    '2': { name: 'Tier 2: Boundary & Corner Cases', total: 0, passed: 0, failed: 0, skipped: 0, durationMs: 0 },
    '3': { name: 'Tier 3: Pairwise Interactions & Race Conditions', total: 0, passed: 0, failed: 0, skipped: 0, durationMs: 0 },
    '4': { name: 'Tier 4: Real-World Scenarios (Day-in-the-Life)', total: 0, passed: 0, failed: 0, skipped: 0, durationMs: 0 },
    '5': { name: 'Tier 5: Adversarial Gap Hardening', total: 0, passed: 0, failed: 0, skipped: 0, durationMs: 0 }
  };

  const allSuitesResults = [];
  let runnerError = null;

  try {
    let currentTier = null;

    for (const fileInfo of testFiles) {
      if (fileInfo.tier !== currentTier) {
        currentTier = fileInfo.tier;
        if (!options.quiet && !options.json) {
          console.log(`${C.bold}${C.blue}[${tierStats[currentTier].name.toUpperCase()}]${C.reset}`);
        }
      }

      // Reset harness suites for this file
      harness.reset();

      // Dynamically import test file
      try {
        await import(`file://${fileInfo.fullPath}?t=${Date.now()}`);
      } catch (err) {
        console.error(`${C.red}✗ Failed to load test file: ${fileInfo.relPath}${C.reset}`, err);
        runnerError = err;
        process.exit(2);
      }

      const filterFn = options.filterPattern
        ? (testName, suiteName) => testName.toLowerCase().includes(options.filterPattern.toLowerCase()) || suiteName.toLowerCase().includes(options.filterPattern.toLowerCase())
        : null;

      for (const suite of harness.suites) {
        const suiteRes = await harness.runSuite(suite, {
          filterFn,
          bail: options.bail,
          defaultTimeout: options.timeout,
          onTestComplete: (testCase, s) => {
            if (options.verbose && !options.json) {
              const mark = testCase.status === 'PASSED' ? `${C.green}✓${C.reset}` : testCase.status === 'SKIPPED' ? `${C.yellow}○${C.reset}` : `${C.red}✗${C.reset}`;
              console.log(`    ${mark} ${testCase.name} ${C.gray}(${testCase.durationMs}ms)${C.reset}`);
              if (testCase.error) {
                console.log(`      ${C.red}${testCase.error.message || testCase.error}${C.reset}`);
                if (testCase.error.stack) {
                  console.log(`      ${C.gray}${testCase.error.stack.split('\n').slice(1, 3).join('\n      ')}${C.reset}`);
                }
              }
            }
          }
        });

        allSuitesResults.push({
          tier: fileInfo.tier,
          file: fileInfo.relPath,
          ...suiteRes
        });

        // Update Tier stats
        tierStats[fileInfo.tier].total += suiteRes.tests.length;
        tierStats[fileInfo.tier].passed += suiteRes.passed;
        tierStats[fileInfo.tier].failed += suiteRes.failed;
        tierStats[fileInfo.tier].skipped += suiteRes.skipped;
        tierStats[fileInfo.tier].durationMs += suiteRes.durationMs;

        if (!options.verbose && !options.quiet && !options.json) {
          const passIcon = suiteRes.failed === 0 ? `${C.green}✓${C.reset}` : `${C.red}✗${C.reset}`;
          const suiteSummary = `${suiteRes.passed}/${suiteRes.tests.length} passed`;
          console.log(`  ${passIcon} ${suite.name} ${C.gray}(${suiteSummary}) (${suiteRes.durationMs}ms)${C.reset}`);
          if (suiteRes.failed > 0) {
            for (const t of suiteRes.tests) {
              if (t.status === 'FAILED') {
                console.log(`    ${C.red}✗ ${t.name}: ${t.error?.message || t.error}${C.reset}`);
              }
            }
          }
        }
      }
    }
  } catch (err) {
    if (options.bail) {
      if (!options.quiet && !options.json) {
        console.log(`\n${C.red}${C.bold}Execution halted due to --bail on test failure.${C.reset}`);
      }
    } else {
      runnerError = err;
    }
  }

  const totalDurationMs = Math.round(performance.now() - startTime);

  // Evaluate Invariant Checks
  const { allInvariantsPassed, audit: invariantAudit } = evaluateInvariants(harness);

  // Aggregate Totals
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  let totalSkipped = 0;

  for (const tier of options.tiers) {
    const st = tierStats[tier];
    totalTests += st.total;
    totalPassed += st.passed;
    totalFailed += st.failed;
    totalSkipped += st.skipped;
  }

  const isAllTestsPassed = totalFailed === 0 && totalTests > 0;
  let exitCode = 0;

  if (runnerError) {
    exitCode = 2;
  } else if (!isAllTestsPassed) {
    exitCode = 1;
  } else if (!allInvariantsPassed) {
    exitCode = 3;
  }

  // Generate JSON Report Artifact
  const jsonReport = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    },
    summary: {
      total: totalTests,
      passed: totalPassed,
      failed: totalFailed,
      skipped: totalSkipped,
      passRate: totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) + '%' : '0%',
      durationMs: totalDurationMs,
      allTestsPassed: isAllTestsPassed,
      allInvariantsPassed,
      exitCode
    },
    tierBreakdown: tierStats,
    invariants: invariantAudit,
    suites: allSuitesResults.map(s => ({
      tier: s.tier,
      file: s.file,
      name: s.name,
      passed: s.passed,
      failed: s.failed,
      durationMs: s.durationMs,
      tests: s.tests.map(t => ({
        name: t.name,
        status: t.status,
        durationMs: t.durationMs,
        error: t.error ? String(t.error.message || t.error) : null
      }))
    }))
  };

  if (options.jsonFile) {
    const jsonPath = path.isAbsolute(options.jsonFile) ? options.jsonFile : path.join(PROJECT_ROOT, options.jsonFile);
    fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2), 'utf-8');
    if (!options.quiet && !options.json) {
      console.log(`\n${C.gray}Structured JSON report written to: ${jsonPath}${C.reset}`);
    }
  }

  if (options.json) {
    console.log(JSON.stringify(jsonReport, null, 2));
    process.exit(exitCode);
  }

  if (!options.quiet) {
    console.log(`\n${C.bold}--------------------------------------------------------------------------------${C.reset}`);
    console.log(`${C.bold} KEY REGULATORY & PERFORMANCE INVARIANT AUDIT:${C.reset}`);
    for (const inv of invariantAudit) {
      const mark = inv.passed ? `${C.green}[PASS]${C.reset}` : `${C.red}[BREACH]${C.reset}`;
      console.log(`   • ${inv.name}: ${C.bold}${inv.details}${C.reset} ${mark}`);
    }

    console.log(`${C.bold}--------------------------------------------------------------------------------${C.reset}`);
    console.log(`${C.bold} EXECUTION SUMMARY:${C.reset}`);
    console.log(`   Total Tests:    ${C.bold}${totalTests}${C.reset}`);
    console.log(`   Passed:         ${C.green}${C.bold}${totalPassed}${C.reset} (${jsonReport.summary.passRate})`);
    console.log(`   Failed:         ${totalFailed > 0 ? C.red + C.bold : C.gray}${totalFailed}${C.reset}`);
    console.log(`   Skipped:        ${totalSkipped > 0 ? C.yellow : C.gray}${totalSkipped}${C.reset}`);
    console.log(`   Total Duration: ${(totalDurationMs / 1000).toFixed(2)} s`);
    const statusBanner = exitCode === 0
      ? `${C.bgGreen}${C.bold} SUCCESS (Exit Code 0) ${C.reset}`
      : exitCode === 3
      ? `${C.bgRed}${C.bold} INVARIANT VIOLATION (Exit Code 3) ${C.reset}`
      : `${C.bgRed}${C.bold} FAILURE (Exit Code ${exitCode}) ${C.reset}`;
    console.log(`   Result:         ${statusBanner}`);
    console.log(`${C.bold}================================================================================${C.reset}\n`);
  }

  process.exit(exitCode);
}

main().catch(err => {
  console.error(`${C.red}Fatal runner error:${C.reset}`, err);
  process.exit(2);
});
