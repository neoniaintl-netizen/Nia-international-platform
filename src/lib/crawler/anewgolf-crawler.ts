import { Cafe24Crawler } from "./cafe24-crawler";
import type { CrawledProduct } from "./types";
import {
  extractMetaFromHtml,
  extractCafe24ProductNo,
  inferGender,
} from "./extractors";

/**
 * 어뉴골프 (anewgolf.com) — Cafe24 기반 한국 골프웨어 자사몰.
 *
 * PLATFORM_PURPOSE.md "그룹 C" — sitemap → /product/ URL → og:image 추출이 성공한 케이스.
 * Cafe24 표준 패턴 그대로 작동하므로 Cafe24Crawler 를 상속하고 다음만 보강:
 *   - sourceSite = "anewgolf"
 *   - brandName 강제 (Cafe24 메타에서 브랜드명을 항상 가져오지는 못함)
 *   - extractors 로 material/origin/careGuide/fit/gender/externalProductId 보강
 *
 * robots.txt 검증:
 *   - /product/* 허용 ✅
 *   - /admin/, /api/, /member/, /myshop/, /order/, /basket/, /checkout/ 차단
 *   - 본 크롤러는 /product/* 만 접근
 */
export class AnewGolfCrawler extends Cafe24Crawler {
  readonly sourceSite = "anewgolf";
  private readonly brandName = "어뉴골프";

  /**
   * anewgolf 메인/카테고리 페이지에서 실제 상품 상세 URL만 추출.
   *
   * cafe24 기본 parser는 list.html?cate_no= 같은 카테고리 페이지도 매칭하기 때문에,
   * `/product/{slug}/{product_no}/...` 패턴 (개별 상품) 으로 한정 필터링.
   */
  parseProductList(html: string): string[] {
    const all = super.parseProductList(html);
    // 개별 상품 URL: /product/<slug>/<number>/  (number는 product_no)
    const productPattern = /\/product\/[a-z0-9-]+\/\d+\//i;
    const filtered = all.filter((u) => productPattern.test(u));
    // 동일 product_no 중복 제거 (icid query 차이로 중복 발생)
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const u of filtered) {
      const m = u.match(/\/product\/[^\/]+\/(\d+)\//);
      const id = m?.[1] ?? u;
      if (!seen.has(id)) {
        seen.add(id);
        unique.push(u);
      }
    }
    return unique;
  }

  parseProductDetail(html: string, url: string): CrawledProduct | null {
    const base = super.parseProductDetail(html, url);
    if (!base) return null;

    // 1) brandName — Cafe24 메타에서 못 가져오거나 "Unknown" 인 경우 강제 지정
    if (!base.brandName || /^unknown$/i.test(base.brandName)) {
      base.brandName = this.brandName;
    }

    // 2) sourceSite 오버라이드 (Cafe24Crawler 가 "cafe24" 로 셋팅하므로)
    base.sourceSite = this.sourceSite;

    // 3) externalProductId — URL의 product_no 추출
    const productNo = extractCafe24ProductNo(url);
    if (productNo) base.externalProductId = productNo;

    // 4) 메타 정보 (소재/제조국/세탁/핏) — description HTML 에서 추출
    const meta = extractMetaFromHtml(base.description || html);
    if (meta.material) base.material = meta.material;
    if (meta.origin) base.origin = meta.origin;
    if (meta.careGuide) base.careGuide = meta.careGuide;
    if (meta.fit) base.fit = meta.fit;

    // 5) 성별 추론 (URL / 카테고리 / 상품명)
    base.gender = inferGender({
      url,
      categoryName: base.categoryName,
      productName: base.name,
    });

    // 6) categoryName 기본값 — 골프웨어 (운영자 검수에서 세부 카테고리 매핑)
    if (!base.categoryName) base.categoryName = "골프웨어";

    return base;
  }
}
