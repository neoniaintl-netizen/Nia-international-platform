import assert from "node:assert";
import { test } from "../harness";
import { runWithConcurrency } from "../scheduler";

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
