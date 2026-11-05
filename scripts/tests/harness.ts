/**
 * Dua Carita Coffee - Automated Test Harness
 * Zero-dependency, lightweight, high-performance TypeScript test runner.
 */

export interface TestResult {
  name: string;
  passed: boolean;
  durationMs: number;
  error?: Error;
}

export interface SuiteResult {
  name: string;
  results: TestResult[];
  passed: boolean;
  durationMs: number;
}

type TestFn = () => void | Promise<void>;
type HookFn = () => void | Promise<void>;

interface TestCase {
  name: string;
  fn: TestFn;
}

interface TestSuite {
  name: string;
  tests: TestCase[];
  beforeAllHooks: HookFn[];
  afterAllHooks: HookFn[];
  beforeEachHooks: HookFn[];
  afterEachHooks: HookFn[];
}

const currentSuites: TestSuite[] = [];
let activeSuite: TestSuite | null = null;

export function describe(name: string, fn: () => void): void {
  const suite: TestSuite = {
    name,
    tests: [],
    beforeAllHooks: [],
    afterAllHooks: [],
    beforeEachHooks: [],
    afterEachHooks: [],
  };
  currentSuites.push(suite);
  activeSuite = suite;
  try {
    fn();
  } finally {
    activeSuite = null;
  }
}

export function it(name: string, fn: TestFn): void {
  if (!activeSuite) {
    describe("Default Suite", () => {
      it(name, fn);
    });
    return;
  }
  activeSuite.tests.push({ name, fn });
}

export const test = it;

export function beforeAll(fn: HookFn): void {
  if (activeSuite) activeSuite.beforeAllHooks.push(fn);
}

export function afterAll(fn: HookFn): void {
  if (activeSuite) activeSuite.afterAllHooks.push(fn);
}

export function beforeEach(fn: HookFn): void {
  if (activeSuite) activeSuite.beforeEachHooks.push(fn);
}

export function afterEach(fn: HookFn): void {
  if (activeSuite) activeSuite.afterEachHooks.push(fn);
}

class Expectation<T = unknown> {
  private isNot: boolean;

  constructor(private actual: T, isNot = false) {
    this.isNot = isNot;
  }

  get not(): Expectation<T> {
    return new Expectation(this.actual, !this.isNot);
  }

  private pass(condition: boolean, failMessage: string) {
    const passed = this.isNot ? !condition : condition;
    if (!passed) {
      throw new Error(this.isNot ? `Expected NOT: ${failMessage}` : failMessage);
    }
  }

  toBe(expected: unknown): void {
    const condition = Object.is(this.actual, expected);
    this.pass(
      condition,
      `Expected ${JSON.stringify(this.actual)} to be ${JSON.stringify(expected)}`
    );
  }

  toEqual(expected: unknown): void {
    const condition = JSON.stringify(this.actual) === JSON.stringify(expected);
    this.pass(
      condition,
      `Expected ${JSON.stringify(this.actual)} to equal ${JSON.stringify(expected)}`
    );
  }

  toBeCloseTo(expected: number, delta = 0.01): void {
    if (typeof this.actual !== "number") {
      throw new Error(`toBeCloseTo expected number, got ${typeof this.actual}`);
    }
    const diff = Math.abs(this.actual - expected);
    const condition = diff <= delta;
    this.pass(
      condition,
      `Expected ${this.actual} to be close to ${expected} (within ±${delta}, diff: ${diff.toFixed(4)})`
    );
  }

  toBeGreaterThan(expected: number): void {
    const val = Number(this.actual);
    this.pass(
      val > expected,
      `Expected ${this.actual} > ${expected}`
    );
  }

  toBeGreaterThanOrEqual(expected: number): void {
    const val = Number(this.actual);
    this.pass(
      val >= expected,
      `Expected ${this.actual} >= ${expected}`
    );
  }

  toBeLessThan(expected: number): void {
    const val = Number(this.actual);
    this.pass(
      val < expected,
      `Expected ${this.actual} < ${expected}`
    );
  }

  toBeLessThanOrEqual(expected: number): void {
    const val = Number(this.actual);
    this.pass(
      val <= expected,
      `Expected ${this.actual} <= ${expected}`
    );
  }

  toBeDefined(): void {
    this.pass(
      this.actual !== undefined,
      `Expected value to be defined, got undefined`
    );
  }

  toBeNull(): void {
    this.pass(
      this.actual === null,
      `Expected ${JSON.stringify(this.actual)} to be null`
    );
  }

  toBeTruthy(): void {
    this.pass(
      Boolean(this.actual),
      `Expected ${JSON.stringify(this.actual)} to be truthy`
    );
  }

  toBeFalsy(): void {
    this.pass(
      !this.actual,
      `Expected ${JSON.stringify(this.actual)} to be falsy`
    );
  }

  toContain(expected: unknown): void {
    if (typeof this.actual === "string") {
      this.pass(
        this.actual.includes(String(expected)),
        `Expected string "${this.actual}" to contain "${expected}"`
      );
      return;
    }
    if (Array.isArray(this.actual)) {
      const found = this.actual.some((item) =>
        item === expected || JSON.stringify(item) === JSON.stringify(expected)
      );
      this.pass(
        found,
        `Expected array to contain ${JSON.stringify(expected)}`
      );
      return;
    }
    throw new Error(`toContain only supports strings and arrays, got ${typeof this.actual}`);
  }

  toThrow(expectedMessage?: string | RegExp): void {
    if (typeof this.actual !== "function") {
      throw new Error(`toThrow expected a function, got ${typeof this.actual}`);
    }
    let threw = false;
    let error: unknown;
    try {
      this.actual();
    } catch (e) {
      threw = true;
      error = e;
    }
    this.pass(threw, `Expected function to throw an error, but it did not`);
    if (threw && expectedMessage) {
      const msg = error instanceof Error ? error.message : String(error);
      if (typeof expectedMessage === "string") {
        this.pass(
          msg.includes(expectedMessage),
          `Expected thrown error "${msg}" to contain "${expectedMessage}"`
        );
      } else {
        this.pass(
          expectedMessage.test(msg),
          `Expected thrown error "${msg}" to match pattern ${expectedMessage}`
        );
      }
    }
  }
}

export function expect<T = unknown>(actual: T): Expectation<T> {
  return new Expectation(actual);
}

// ANSI Color Helpers
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

export async function runAllSuites(): Promise<boolean> {
  const overallStart = Date.now();
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  let suiteFailures = 0;

  console.log(`\n${colors.bold}${colors.cyan}====================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}   DUA CARITA COFFEE — AUTOMATED TEST RUNNER       ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}\n`);

  for (const suite of currentSuites) {
    const suiteStart = Date.now();
    console.log(`${colors.bold}● ${suite.name}${colors.reset}`);

    // beforeAll
    for (const hook of suite.beforeAllHooks) {
      try {
        await hook();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.log(`  ${colors.red}✗ [beforeAll hook failed]: ${msg}${colors.reset}`);
      }
    }

    let suiteHadFailure = false;

    for (const testCase of suite.tests) {
      totalTests++;
      const testStart = Date.now();

      // beforeEach
      for (const hook of suite.beforeEachHooks) {
        try {
          await hook();
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.log(`    ${colors.red}✗ [beforeEach hook failed]: ${msg}${colors.reset}`);
        }
      }

      try {
        await testCase.fn();
        const duration = Date.now() - testStart;
        totalPassed++;
        console.log(
          `  ${colors.green}✓${colors.reset} ${colors.dim}[${duration}ms]${colors.reset} ${testCase.name}`
        );
      } catch (err) {
        const duration = Date.now() - testStart;
        totalFailed++;
        suiteHadFailure = true;
        const msg = err instanceof Error ? err.message : String(err);
        console.log(
          `  ${colors.red}✗ [${duration}ms] ${testCase.name}${colors.reset}`
        );
        console.log(`    ${colors.red}Error: ${msg}${colors.reset}`);
        if (err instanceof Error && err.stack) {
          const stackLine = err.stack.split("\n")[1] || "";
          console.log(`    ${colors.gray}${stackLine.trim()}${colors.reset}`);
        }
      }

      // afterEach
      for (const hook of suite.afterEachHooks) {
        try {
          await hook();
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.log(`    ${colors.red}✗ [afterEach hook failed]: ${msg}${colors.reset}`);
        }
      }
    }

    // afterAll
    for (const hook of suite.afterAllHooks) {
      try {
        await hook();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.log(`  ${colors.red}✗ [afterAll hook failed]: ${msg}${colors.reset}`);
      }
    }

    if (suiteHadFailure) suiteFailures++;
    const suiteDuration = Date.now() - suiteStart;
    console.log(`${colors.dim}  (suite completed in ${suiteDuration}ms)${colors.reset}\n`);
  }

  const overallDuration = ((Date.now() - overallStart) / 1000).toFixed(2);

  console.log(`${colors.bold}${colors.cyan}----------------------------------------------------${colors.reset}`);
  console.log(
    `${colors.bold}Test Suites: ${
      suiteFailures > 0
        ? `${colors.red}${suiteFailures} failed${colors.reset}, `
        : ""
    }${colors.green}${currentSuites.length - suiteFailures} passed${colors.reset}, ${currentSuites.length} total`
  );
  console.log(
    `${colors.bold}Tests:       ${
      totalFailed > 0 ? `${colors.red}${totalFailed} failed${colors.reset}, ` : ""
    }${colors.green}${totalPassed} passed${colors.reset}, ${totalTests} total`
  );
  console.log(`${colors.bold}Time:        ${overallDuration}s${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}\n`);

  return totalFailed === 0;
}

// Auto-run if executed as CLI entry point
if (process.argv[1]?.endsWith("harness.ts")) {
  runAllSuites().then((success) => {
    process.exit(success ? 0 : 1);
  });
}
