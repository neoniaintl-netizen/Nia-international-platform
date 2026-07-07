import assert from "node:assert";
import { test } from "../harness";
import { withRetry } from "../base-crawler";

test("3회 재시도 후 성공", async () => {
  let n = 0;
  const r = await withRetry(
    async () => {
      n++;
      if (n < 3) throw new Error("fail");
      return "ok";
    },
    3,
    1,
  );
  assert.equal(r, "ok");
  assert.equal(n, 3);
});

test("전부 실패 → 마지막 에러 throw", async () => {
  let n = 0;
  await assert.rejects(
    withRetry(
      async () => {
        n++;
        throw new Error("always");
      },
      3,
      1,
    ),
  );
  assert.equal(n, 3);
});
