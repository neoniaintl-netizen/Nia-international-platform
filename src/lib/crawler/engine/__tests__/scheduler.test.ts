import assert from "node:assert";
import { test } from "../harness";
import { runWithConcurrency } from "../scheduler";
import { evaluateCrawlAlert } from "../alerts";

test("알림: 수집 0건 → 경고", () => {
  assert.equal(evaluateCrawlAlert(0, 100), "수집 0건");
});
test("알림: 전일 대비 -50% 초과 급감 → 경고", () => {
  assert.ok(evaluateCrawlAlert(40, 100)?.includes("급감"));
});
test("알림: 정상(감소 미미) → null", () => {
  assert.equal(evaluateCrawlAlert(90, 100), null);
});
test("알림: 이전 데이터 없음(첫 실행) → null", () => {
  assert.equal(evaluateCrawlAlert(50, null), null);
});

test("동시성 상한 준수", async () => {
  let active = 0;
  let maxActive = 0;
  const tasks = Array.from({ length: 6 }, () => async () => {
    active++;
    maxActive = Math.max(maxActive, active);
    await new Promise((r) => setTimeout(r, 10));
    active--;
    return 1;
  });
  await runWithConcurrency(tasks, 2);
  assert.ok(maxActive <= 2, `maxActive=${maxActive}`);
});

test("모든 결과를 입력 순서대로 반환", async () => {
  const tasks = [1, 2, 3, 4].map((n) => async () => {
    await new Promise((r) => setTimeout(r, (5 - n) * 5));
    return n * 10;
  });
  const out = await runWithConcurrency(tasks, 2);
  assert.deepEqual(out, [10, 20, 30, 40]);
});
