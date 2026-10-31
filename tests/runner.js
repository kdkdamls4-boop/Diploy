/**
 * ==============================================================================
 * DIPLOY GAMES - AUTOMATED E2E TEST RUNNER (tests/runner.js)
 * ==============================================================================
 * Standalone test runner built purely on standard Node.js built-ins.
 * Executes all 4 tiers of opaque-box tests:
 * - Tier 1: Feature Coverage (PROJECT.md Inventory #1-26)
 * - Tier 2: Boundary & Corner Cases (Limits, Edge Inputs, Corrupted Data)
 * - Tier 3: Cross-Feature Combinations (Mixed Carts, Promo Codes, Receipts)
 * - Tier 4: Real-World Application Scenarios (Full E2E User Journeys)
 *
 * Usage:
 *   node tests/runner.js             # Runs all tiers
 *   node tests/runner.js --tier=1    # Runs only Tier 1
 *   node tests/runner.js --tier=2    # Runs only Tier 2
 *   node tests/runner.js --tier=3    # Runs only Tier 3
 *   node tests/runner.js --tier=4    # Runs only Tier 4
 *   node tests/runner.js --allow-fail # Exit code 0 even if tests fail (diagnostic)
 */

const path = require('node:path');

// Load test suites
const tier1 = require('./tier1_feature_coverage.test.js');
const tier2 = require('./tier2_boundaries.test.js');
const tier3 = require('./tier3_combinations.test.js');
const tier4 = require('./tier4_real_world.test.js');

const allSuites = [tier1, tier2, tier3, tier4];

// Parse CLI flags
const args = process.argv.slice(2);
let targetTier = null;
let allowFail = false;

for (const arg of args) {
  if (arg.startsWith('--tier=')) {
    targetTier = parseInt(arg.split('=')[1], 10);
  } else if (arg === '-t' && args[args.indexOf(arg) + 1]) {
    targetTier = parseInt(args[args.indexOf(arg) + 1], 10);
  } else if (arg === '--allow-fail') {
    allowFail = true;
  }
}

const suitesToRun = targetTier
  ? allSuites.filter(s => s.tier === targetTier)
  : allSuites;

if (suitesToRun.length === 0) {
  console.error(`Error: Unknown tier "${targetTier}". Valid tiers are 1, 2, 3, 4.`);
  process.exit(1);
}

async function run() {
  const startTime = Date.now();
  console.log('='.repeat(80));
  console.log('DIPLOY GAMES — AUTOMATED E2E TEST RUNNER');
  console.log(`Node.js ${process.version} | Standalone Opaque-Box Test Suite`);
  console.log('='.repeat(80));

  const tierStats = [];
  const failures = [];
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  for (const suite of suitesToRun) {
    console.log(`\n=== ${suite.title} ===`);
    let suitePassed = 0;
    let suiteFailed = 0;

    for (const test of suite.tests) {
      totalTests++;
      const testStart = Date.now();
      try {
        await test.fn();
        const duration = Date.now() - testStart;
        suitePassed++;
        totalPassed++;
        console.log(`  [PASS] ${test.id}: ${test.name} (${duration}ms)`);
      } catch (err) {
        const duration = Date.now() - testStart;
        suiteFailed++;
        totalFailed++;
        console.log(`  [FAIL] ${test.id}: ${test.name} (${duration}ms)`);
        failures.push({
          id: test.id,
          name: test.name,
          tier: suite.tier,
          error: err.message,
          stack: err.stack
        });
      }
    }

    tierStats.push({
      tier: suite.tier,
      title: suite.title,
      passed: suitePassed,
      failed: suiteFailed,
      total: suite.tests.length
    });
  }

  const totalDuration = Date.now() - startTime;

  console.log('\n' + '-'.repeat(80));
  console.log('E2E TEST EXECUTION SUMMARY');
  console.log('-'.repeat(80));
  for (const stat of tierStats) {
    const label = `Tier ${stat.tier} (${stat.title.split(':')[1]?.split('(')[0]?.trim() || stat.title}):`;
    const padded = label.padEnd(36);
    console.log(`  ${padded} ${stat.passed} / ${stat.total} passed (${stat.failed} failed)`);
  }
  console.log('-'.repeat(80));
  console.log(`  TOTAL: ${totalPassed} passed, ${totalFailed} failed, ${totalTests} total (${totalDuration}ms)`);
  console.log('='.repeat(80));

  if (failures.length > 0) {
    console.log(`\nFAILED TESTS DETAILS (${failures.length}):`);
    failures.forEach((f, idx) => {
      console.log(`\n${idx + 1}. [${f.id}] (Tier ${f.tier}) ${f.name}`);
      console.log(`   Error: ${f.error}`);
    });
    console.log('\n' + '='.repeat(80));
  }

  if (totalFailed > 0 && !allowFail) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run().catch(err => {
  console.error('Fatal runner error:', err);
  process.exit(1);
});
