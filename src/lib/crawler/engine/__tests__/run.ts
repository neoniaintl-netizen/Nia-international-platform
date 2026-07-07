// 전체 엔진 테스트 러너 — `npx tsx src/lib/crawler/engine/__tests__/run.ts`
import { report } from "../harness";

import "./content-hash.test";
import "./types.test";
import "./robots.test";
import "./base-crawler.test";
import "./scheduler.test";

report();
