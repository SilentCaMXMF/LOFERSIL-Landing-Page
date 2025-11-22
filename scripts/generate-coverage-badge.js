#!/usr/bin/env node

/**
 * Coverage Badge Generator
 *
 * Generates coverage badges for README.md based on Vitest coverage reports
 */

import fs from 'fs';
import path from 'path';

const COVERAGE_DIR = 'coverage';
const BADGE_TEMPLATE = 'https://img.shields.io/badge/coverage-{percentage}25-{color}';
const COLORS = {
  excellent: 'brightgreen',
  good: 'green',
  satisfactory: 'yellowgreen',
  poor: 'orange',
  critical: 'red',
};

function getCoverageColor(percentage) {
  if (percentage >= 90) return COLORS.excellent;
  if (percentage >= 80) return COLORS.good;
  if (percentage >= 70) return COLORS.satisfactory;
  if (percentage >= 60) return COLORS.poor;
  return COLORS.critical;
}

function generateBadge(percentage, type = 'overall') {
  const color = getCoverageColor(percentage);
  const badgeUrl = BADGE_TEMPLATE.replace('{percentage}', percentage.toFixed(1)).replace(
    '{color}',
    color
  );

  return `[![Coverage ${type}](${badgeUrl})](coverage/lcov-report/index.html)`;
}

function readCoverageSummary() {
  const summaryPath = path.join(COVERAGE_DIR, 'coverage-summary.json');

  if (!fs.existsSync(summaryPath)) {
    console.error('Coverage summary not found. Run tests with coverage first.');
    process.exit(1);
  }

  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  return summary.total;
}

function updateReadme(coverage) {
  const readmePath = 'README.md';

  if (!fs.existsSync(readmePath)) {
    console.log('README.md not found, skipping badge update');
    return;
  }

  let readme = fs.readFileSync(readmePath, 'utf8');

  // Generate badges
  const overallBadge = generateBadge(coverage.lines.pct, 'Lines');
  const functionsBadge = generateBadge(coverage.functions.pct, 'Functions');
  const branchesBadge = generateBadge(coverage.branches.pct, 'Branches');
  const statementsBadge = generateBadge(coverage.statements.pct, 'Statements');

  const coverageSection = `## Test Coverage

${overallBadge} ${functionsBadge} ${branchesBadge} ${statementsBadge}

**Coverage Summary:**
- Lines: ${coverage.lines.pct.toFixed(1)}% (${coverage.lines.covered}/${coverage.lines.total})
- Functions: ${coverage.functions.pct.toFixed(1)}% (${coverage.functions.covered}/${coverage.functions.total})
- Branches: ${coverage.branches.pct.toFixed(1)}% (${coverage.branches.covered}/${coverage.branches.total})
- Statements: ${coverage.statements.pct.toFixed(1)}% (${coverage.statements.covered}/${coverage.statements.total})

[View detailed coverage report](coverage/lcov-report/index.html)

*Last updated: ${new Date().toISOString().split('T')[0]}*
`;

  // Replace or add coverage section
  const coverageRegex = /## Test Coverage[\s\S]*?(?=## |\n## |\*\*Last updated|$)/;
  if (coverageRegex.test(readme)) {
    readme = readme.replace(coverageRegex, coverageSection);
  } else {
    // Add after the first heading
    const firstHeadingRegex = /(^# .*$)/m;
    readme = readme.replace(firstHeadingRegex, '$1\n\n' + coverageSection);
  }

  fs.writeFileSync(readmePath, readme);
  console.log('✅ README.md updated with coverage badges');
}

function main() {
  try {
    const coverage = readCoverageSummary();

    console.log('📊 Coverage Summary:');
    console.log(`   Lines: ${coverage.lines.pct.toFixed(1)}%`);
    console.log(`   Functions: ${coverage.functions.pct.toFixed(1)}%`);
    console.log(`   Branches: ${coverage.branches.pct.toFixed(1)}%`);
    console.log(`   Statements: ${coverage.statements.pct.toFixed(1)}%`);

    updateReadme(coverage);

    // Check thresholds
    const thresholds = { lines: 80, functions: 80, branches: 80, statements: 80 };
    let failed = false;

    Object.entries(thresholds).forEach(([type, threshold]) => {
      const actual = coverage[type].pct;
      if (actual < threshold) {
        console.error(`❌ ${type} coverage ${actual.toFixed(1)}% is below threshold ${threshold}%`);
        failed = true;
      }
    });

    if (failed) {
      console.error('❌ Coverage thresholds not met!');
      process.exit(1);
    } else {
      console.log('✅ All coverage thresholds met!');
    }
  } catch (error) {
    console.error('Error generating coverage badge:', error.message);
    process.exit(1);
  }
}

main();
