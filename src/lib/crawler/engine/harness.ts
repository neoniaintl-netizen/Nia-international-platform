// 경량 테스트 하네스 — 신규 의존성 없이 node:assert + tsx로 실행.
type TestFn = () => void | Promise<void>;

const cases: Array<{ name: string; fn: TestFn }> = [];

export function test(name: string, fn: TestFn): void {
  cases.push({ name, fn });
}

export async function report(): Promise<void> {
  let passed = 0;
  let failed = 0;
  for (const c of cases) {
    try {
      await c.fn();
      console.log(`  ✓ ${c.name}`);
      passed++;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`  ✗ ${c.name}\n    ${msg}`);
      failed++;
    }
  }
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}
