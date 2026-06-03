/**
 * Funpay 환율조회(exchangerate/query.icb) 프로브 — 우리 MID/알리페이에서 쓸 수 있는지 확인.
 * 안전: 조회만. 과금/주문 생성 없음. secretKey 비표시.
 * 실행: npx tsx scripts/funpay-fx-probe.ts
 */
import { readFileSync } from "fs";
import { createHash } from "crypto";

const env: Record<string, string> = {};
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const MID = env.FUNPAY_MID ?? "";
const SECRET = env.FUNPAY_SECRET_KEY ?? "";
const BASE = env.FUNPAY_API_BASE ?? "https://onlinetest.funpay.co.kr";
const URL = `${BASE}/exchangerate/query.icb`;

function buildFgkey(params: Record<string, string>): string {
  const ps = Object.entries(params)
    .filter(([k]) => k !== "fgkey")
    .map(([k, v]) => `${k}=${v ?? ""}`)
    .join("&");
  const textA = [...ps].sort().join("");
  return createHash("sha256").update(`${SECRET}?${textA}`, "utf8").digest("hex").toUpperCase();
}

async function probe(servicetype: string, reqcur: string) {
  const p: Record<string, string> = { ver: "V2", mid: MID, servicetype, reqcur, date: "20260604" };
  p.fgkey = buildFgkey(p);
  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
    body: new URLSearchParams(p).toString(),
  });
  const text = await res.text();
  console.log(`\n[${servicetype} / ${reqcur}] HTTP ${res.status}`);
  console.log("  " + text.replace(/\s+/g, " ").slice(0, 400));
}

async function main() {
  console.log(`mid=${MID} (secret 비표시)`);
  for (const s of ["S000", "S001"]) {
    for (const c of ["CNY", "KRW", "USD"]) {
      await probe(s, c);
    }
  }
}
main();
