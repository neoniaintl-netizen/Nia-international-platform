/**
 * fgkey 생성 단위 검증 — 명세 공식 예시값 재현 확인.
 * 실행: npx tsx scripts/funpay-fgkey-check.ts
 *
 * 명세 예시:
 *   파라미터 문자열 → fgkey "901E63C166D93CB5D94C294CC18C88E5B16593DDEA56E1E6D3BAEBB1A03900CC"
 *   secretKey: 12AE98E356C23351B1D74A3937B627A0
 */
import { buildFgkey, verifyFgkey } from "../src/lib/payment/funpay";

const SECRET = "12AE98E356C23351B1D74A3937B627A0";
const EXPECTED =
  "901E63C166D93CB5D94C294CC18C88E5B16593DDEA56E1E6D3BAEBB1A03900CC";

const exampleParamString =
  'refno=20231114181526&expiretime=&walletId=CONNECT_WALLET&ver=V2&product=兰芝 雪纱丝柔气垫隔离霜 SPF22 PA++&reqamt=1.00&statusurl=http://onlinetest.funpay.co.kr:8079/demo/statusurl.jsp&refer_url=http://testmerchant.com&insmonth=&mid=P00000000000&mname=&param3=&reqcur=USD&param1=&param2=&restype=JSON&servicetype=S000&paypal_additional_data=&trade_information={"business_type":4,"goods_info":"pencil^2|eraser^5|iPhone XS 256G^1","total_quantity":8}&reqtype=P&tel=010-1004-1004&returnurl=https://onlinetest.funpay.co.kr/demo/paymentResult.jsp&email=test@icbnet.co.kr&buyername=裴国花';

let pass = true;

// 1) 생성 검증
const fg = buildFgkey(exampleParamString, SECRET);
const ok1 = fg === EXPECTED;
console.log(`[1] buildFgkey 예시 재현: ${ok1 ? "PASS ✅" : "FAIL ❌"}`);
if (!ok1) {
  console.log("    expected:", EXPECTED);
  console.log("    actual:  ", fg);
  pass = false;
}

// 2) 검증 함수 (fgkey 포함 객체)
const objParams: Record<string, string> = {};
for (const kv of exampleParamString.split("&")) {
  const i = kv.indexOf("=");
  objParams[kv.slice(0, i)] = kv.slice(i + 1);
}
objParams.fgkey = EXPECTED;
const ok2 = verifyFgkey(objParams, SECRET);
console.log(`[2] verifyFgkey 정상 검증: ${ok2 ? "PASS ✅" : "FAIL ❌"}`);
if (!ok2) pass = false;

// 3) 변조 탐지 (값 1개 변경 → 검증 실패해야 함)
const tampered = { ...objParams, reqamt: "9999.00" };
const ok3 = verifyFgkey(tampered, SECRET) === false;
console.log(`[3] verifyFgkey 변조 탐지: ${ok3 ? "PASS ✅" : "FAIL ❌"}`);
if (!ok3) pass = false;

console.log(pass ? "\n✅ 모든 fgkey 테스트 통과" : "\n❌ 테스트 실패");
process.exit(pass ? 0 : 1);
