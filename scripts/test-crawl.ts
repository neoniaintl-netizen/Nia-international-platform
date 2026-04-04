/**
 * 무신사 크롤러 테스트 스크립트
 * 실행: npx tsx scripts/test-crawl.ts
 */
import { MusinsaCrawler } from "../src/lib/crawler/musinsa-crawler";

const TEST_URL = "https://www.musinsa.com/products/4546498";

async function main() {
  const crawler = new MusinsaCrawler();

  console.log("=== 무신사 크롤러 테스트 ===\n");
  console.log(`대상 URL: ${TEST_URL}\n`);

  // 1) HTML 가져오기
  console.log("1) HTML 페치 중...");
  const res = await fetch(TEST_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
    },
  });

  if (!res.ok) {
    console.error(`HTTP ${res.status} 에러!`);
    process.exit(1);
  }

  const html = await res.text();
  console.log(`   HTML 크기: ${(html.length / 1024).toFixed(1)}KB\n`);

  // 2) __MSS__ 데이터 존재 확인
  const hasMSS = html.includes("window.__MSS__");
  const hasNextData = html.includes("__NEXT_DATA__");
  const hasOgTitle = html.includes('property="og:title"');
  console.log(`2) 데이터 소스 확인:`);
  console.log(`   window.__MSS__: ${hasMSS ? "✅ 있음" : "❌ 없음"}`);
  console.log(`   __NEXT_DATA__: ${hasNextData ? "✅ 있음" : "❌ 없음"}`);
  console.log(`   og:title 메타: ${hasOgTitle ? "✅ 있음" : "❌ 없음"}\n`);

  // 3) 상품 상세 파싱
  console.log("3) parseProductDetail() 실행...");
  const product = crawler.parseProductDetail(html, TEST_URL);

  if (!product) {
    console.error("❌ 파싱 실패! product가 null입니다.");

    // 디버그: __MSS__ 패턴 직접 확인
    console.log("\n--- 디버그 ---");
    const patterns = [
      /window\.__MSS__\s*=\s*\{/,
      /window\.__MSS__\s*=/,
      /__MSS__/,
    ];
    for (const p of patterns) {
      const match = html.match(p);
      console.log(`패턴 ${p}: ${match ? "매치됨" : "없음"}`);
    }

    // __NEXT_DATA__ 확인
    const nextMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]{0,200})/);
    if (nextMatch) {
      console.log(`__NEXT_DATA__ 시작: ${nextMatch[1].slice(0, 100)}...`);
    }

    // meta 태그 확인
    const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/);
    if (ogTitleMatch) {
      console.log(`og:title: ${ogTitleMatch[1]}`);
    }

    process.exit(1);
  }

  console.log("✅ 파싱 성공!\n");
  console.log("=== 크롤링 결과 ===");
  console.log(`상품명:    ${product.name}`);
  console.log(`브랜드:    ${product.brandName}`);
  console.log(`카테고리:  ${product.categoryName || "(없음)"}`);
  console.log(`정가:      ${product.originalPrice?.toLocaleString()}원`);
  console.log(`할인가:    ${product.salePrice ? product.salePrice.toLocaleString() + "원" : "(없음)"}`);
  console.log(`이미지:    ${product.imageUrls.length}개`);
  product.imageUrls.forEach((url, i) => console.log(`  [${i}] ${url}`));
  console.log(`설명:      ${product.description?.slice(0, 100) || "(없음)"}...`);
  console.log(`옵션:      ${product.variants?.length || 0}개`);
  product.variants?.forEach((v) =>
    console.log(`  - ${v.size || v.color || "?"} (재고: ${v.stock})`)
  );
  console.log(`소스URL:   ${product.sourceUrl}`);
  console.log(`소스사이트: ${product.sourceSite}`);

  // 4) 목록 페이지 테스트
  console.log("\n\n=== 목록 페이지 파싱 테스트 ===");
  console.log("카테고리 페이지 가져오는 중...");

  try {
    const listRes = await fetch("https://www.musinsa.com/category/001", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
      },
    });

    if (listRes.ok) {
      const listHtml = await listRes.text();
      console.log(`HTML 크기: ${(listHtml.length / 1024).toFixed(1)}KB`);
      const urls = crawler.parseProductList(listHtml);
      console.log(`추출된 상품 URL: ${urls.length}개`);
      urls.slice(0, 5).forEach((url, i) => console.log(`  [${i}] ${url}`));
      if (urls.length > 5) console.log(`  ... 외 ${urls.length - 5}개`);
    } else {
      console.log(`목록 페이지 HTTP ${listRes.status}`);
    }
  } catch (err: any) {
    console.log(`목록 페이지 에러: ${err.message}`);
  }

  console.log("\n✅ 테스트 완료!");
}

main().catch((err) => {
  console.error("스크립트 에러:", err);
  process.exit(1);
});
