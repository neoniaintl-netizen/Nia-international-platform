/**
 * 무신사 티셔츠 크롤링 → DB 저장 실험
 * 실행: npx tsx scripts/test-crawl-import.ts
 */
import { MusinsaCrawler } from "../src/lib/crawler/musinsa-crawler";

// 무신사 스탠다드 릴렉스 핏 크루 넥 반팔 티셔츠 [화이트]
const TARGET_URL = "https://www.musinsa.com/products/999602";

async function main() {
  const crawler = new MusinsaCrawler();

  console.log("🕷️  무신사 크롤링 실험\n");
  console.log(`대상: ${TARGET_URL}\n`);

  // 1) HTML 가져오기
  console.log("1) HTML 페치 중...");
  const res = await fetch(TARGET_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
    },
  });

  if (!res.ok) {
    console.error(`❌ HTTP ${res.status}`);
    process.exit(1);
  }

  const html = await res.text();
  console.log(`   HTML 크기: ${(html.length / 1024).toFixed(1)}KB\n`);

  // 2) 파싱
  console.log("2) 상품 파싱 중...");
  const product = crawler.parseProductDetail(html, TARGET_URL);

  if (!product) {
    console.error("❌ 파싱 실패!");
    process.exit(1);
  }

  console.log("✅ 파싱 성공!\n");
  console.log("━".repeat(50));
  console.log(`상품명:     ${product.name}`);
  console.log(`브랜드:     ${product.brandName}`);
  console.log(`카테고리:   ${product.categoryName || "(없음)"}`);
  console.log(`정가:       ${product.originalPrice?.toLocaleString()}원`);
  console.log(`할인가:     ${product.salePrice ? product.salePrice.toLocaleString() + "원" : "(없음)"}`);
  console.log(`이미지:     ${product.imageUrls.length}개`);
  product.imageUrls.forEach((url, i) => console.log(`  [${i}] ${url}`));
  console.log(`옵션:       ${product.variants?.length || 0}개`);
  product.variants?.forEach((v) =>
    console.log(`  - ${v.size || v.color || "?"} (재고: ${v.stock})`)
  );
  if (product.tags?.length) {
    console.log(`태그:       ${product.tags.join(", ")}`);
  }
  console.log(`소스URL:    ${product.sourceUrl}`);
  console.log("━".repeat(50));

  // 3) JSON 출력 (DB 저장용 데이터 확인)
  console.log("\n📦 DB 저장용 JSON:");
  console.log(JSON.stringify(product, null, 2));
}

main().catch((err) => {
  console.error("에러:", err);
  process.exit(1);
});
