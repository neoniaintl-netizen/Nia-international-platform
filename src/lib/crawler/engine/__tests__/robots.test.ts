import assert from "node:assert";
import { test } from "../harness";
import { parseRobots, isAllowed } from "../robots";

const ROBOTS = "User-agent: *\nDisallow: /admin/\nDisallow: /member/\nAllow: /product/\n";

test("차단 경로 판정", () => {
  const r = parseRobots(ROBOTS);
  assert.equal(isAllowed(r, "/admin/list"), false);
  assert.equal(isAllowed(r, "/member/login"), false);
  assert.equal(isAllowed(r, "/product/123"), true);
});

test("규칙 없는 경로는 허용", () => {
  const r = parseRobots(ROBOTS);
  assert.equal(isAllowed(r, "/category/golf"), true);
});

test("다른 user-agent 블록은 무시", () => {
  const r = parseRobots("User-agent: BadBot\nDisallow: /\n\nUser-agent: *\nAllow: /product/\n");
  assert.equal(isAllowed(r, "/product/1"), true);
});
