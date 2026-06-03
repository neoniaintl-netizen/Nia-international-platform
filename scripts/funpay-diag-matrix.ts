/**
 * Funpay payment.icb 진단 — servicetype × 통화 매트릭스.
 *
 * 목적: [9300] PARAMETER_INVALID_ERROR : [P12000000325/S001/KRW] 의 정확한 원인 특정.
 *   어떤 (servicetype, reqcur) 조합이 거부되고 어떤 조합이 통과하는지 실측.
 *
 * 안전: payment.icb 1단계(승인요청)는 결제페이지/QR 만 반환 → 실제 청구는 QR 스캔 시점.
 *   이 스크립트는 QR 을 스캔하지 않으므로 과금 없음. 금액도 통화별 최소값 사용.
 *
 * 보안: secretKey 는 절대 콘솔에 출력하지 않음. .env.local 에서 직접 읽음.
 *
 * 실행: npx tsx scripts/funpay-diag-matrix.ts
 */
import { readFileSync } from "fs";
import { createHash } from "crypto";

// ── .env.local 로드 (secret 은 메모리에만, 출력 금지) ──
const env: Record<string, string> = {};
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const MID = env.FUNPAY_MID ?? "";
const SECRET = env.FUNPAY_SECRET_KEY ?? "";
const BASE = env.FUNPAY_API_BASE ?? "https://onlinetest.funpay.co.kr";
const SITE = env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
const PAYMENT_URL = `${BASE}/payment/payment.icb`;

if (!MID || !SECRET) {
  console.error("FUNPAY_MID / FUNPAY_SECRET_KEY 가 .env.local 에 없습니다.");
  process.exit(1);
}
console.log(`mid=${MID}  base=${BASE}  (secret 길이=${SECRET.length}, 값은 비표시)\n`);

// ── fgkey (lib 과 동일 로직) ──
function toParamString(params: Record<string, string>): string {
  return Object.entries(params)
    .filter(([k]) => k !== "fgkey")
    .map(([k, v]) => `${k}=${v ?? ""}`)
    .join("&");
}
function buildFgkey(params: Record<string, string>): string {
  const textA = [...toParamString(params)].sort().join("");
  return createHash("sha256").update(`${SECRET}?${textA}`, "utf8").digest("hex").toUpperCase();
}

let counter = 0;
function uniqueRefno(tag: string): string {
  counter += 1;
  return `DIAG-${tag}-${Date.now()}-${counter}`;
}

function tradeInfo(servicetype: string): string {
  if (servicetype === "S001") {
    return JSON.stringify({ goods_detail: [{ goods_name: "diag item", quantity: 1 }] });
  }
  return JSON.stringify({ business_type: "4", goods_info: "diag item^1", total_quantity: 1 });
}

function buildParams(servicetype: string, reqcur: string, reqamt: string): Record<string, string> {
  const p: Record<string, string> = {
    ver: "V2",
    mid: MID,
    servicetype,
    refno: uniqueRefno(`${servicetype}-${reqcur}`),
    reqcur,
    reqamt,
    buyername: "diag buyer",
    product: "diag product",
    trade_information: tradeInfo(servicetype),
    refer_url: `${SITE}/checkout`,
    returnurl: `${SITE}/checkout/complete`,
    statusurl: `${SITE}/api/payment/funpay/notify`,
    reqtype: "M",
    restype: "JSON", // JSON 응답 → rescode 파싱
    mname: "",
    vat: "",
    tel: "",
    email: "",
    param1: "",
    param2: "",
    param3: "",
    walletId: "",
    insmonth: "",
    expiretime: "",
    paypal_additional_data: "",
  };
  p.fgkey = buildFgkey(p);
  return p;
}

function amountFor(cur: string): string {
  if (cur === "KRW") return "100";
  if (cur === "USD") return "1.00";
  if (cur === "CNY") return "1.00";
  return "1.00";
}

async function callOnce(servicetype: string, reqcur: string) {
  const params = buildParams(servicetype, reqcur, amountFor(reqcur));
  const body = new URLSearchParams(params).toString();
  let res: Response;
  try {
    res = await fetch(PAYMENT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      body,
    });
  } catch (e: any) {
    return { servicetype, reqcur, rescode: "NET_ERR", resmsg: e?.message ?? "fetch failed" };
  }
  const text = await res.text();
  let rescode = "";
  let resmsg = "";
  try {
    const j: any = JSON.parse(text);
    rescode = String(j.rescode ?? j.resultcode ?? j.code ?? "");
    resmsg = String(j.resmsg ?? j.resultmsg ?? j.message ?? j.errmsg ?? "");
    // QR/redirect URL 이 오면 통과 신호
    if (!rescode && (j.payurl || j.url || j.qrcode || j.qr_url || j.redirect)) {
      rescode = "(URL 반환=통과)";
    }
  } catch {
    // JSON 이 아니면 HTML 결제페이지일 가능성 (= 통과). 앞부분만 표시.
    const head = text.replace(/\s+/g, " ").slice(0, 120);
    rescode = `(HTML/${res.status})`;
    resmsg = head;
  }
  return { servicetype, reqcur, rescode, resmsg };
}

async function main() {
  const SVC = [
    { code: "S001", label: "위챗페이" },
    { code: "S000", label: "알리페이" },
  ];
  const CUR = ["KRW", "CNY", "USD"];

  console.log("servicetype | 통화 | rescode | resmsg");
  console.log("------------|------|---------|-------");
  for (const s of SVC) {
    for (const c of CUR) {
      const r = await callOnce(s.code, c);
      const code = r.rescode || "(빈응답)";
      const msg = (r.resmsg || "").slice(0, 80);
      console.log(`${s.code}(${s.label}) | ${c} | ${code} | ${msg}`);
    }
  }
  console.log("\n해석: 0000/8000/URL/HTML = 조합 허용,  9300 = 파라미터(조합) 거부,  9301 = fgkey 오류");
}

main();
