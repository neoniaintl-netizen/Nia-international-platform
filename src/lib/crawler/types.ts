/** 크롤링된 상품 원시 데이터
 *
 * 사용자 명세 (CrawledProduct) 와 호환되도록 optional 필드 확장.
 * 기존 호출처 (musinsa/cafe24/shopify/...) 영향 없도록 모든 신규 필드는 optional.
 */
export interface CrawledProduct {
  // ─── 기존 (그대로 유지) ───
  name: string;
  brandName: string;
  categoryName?: string;
  originalPrice: number;
  salePrice?: number;
  description?: string;
  imageUrls: string[];
  sourceUrl: string;
  sourceSite: string;
  variants?: CrawledVariant[];
  tags?: string[];

  // ─── 사용자 명세 (CrawledProduct) 반영 — 모두 optional ───
  /** 성별 — ProductTag `gender:MEN/WOMEN/UNISEX` 로 저장 */
  gender?: "MEN" | "WOMEN" | "UNISEX" | "UNKNOWN";
  /** DETAILS 탭용 추가 이미지 (상세 페이지 하단 long-form). imageUrls 와 분리 */
  detailImages?: string[];
  /** 소재 — description HTML 상단 메타 섹션에 삽입 */
  material?: string;
  /** 제조국 — description HTML 상단 메타 섹션에 삽입 */
  origin?: string;
  /** 세탁법 — description HTML 상단 메타 섹션에 삽입 */
  careGuide?: string;
  /** 핏 정보 — description HTML 상단 메타 섹션에 삽입 */
  fit?: string;
  /** 시즌 — ProductTag `season:2026SS` 로 저장 */
  season?: string;
  /** 내부 상품 코드 — ProductTag `code:XXX` */
  productCode?: string;
  /** 외부 사이트 상품 ID — ProductTag `extId:XXX` */
  externalProductId?: string;
  /** 원본 사이트의 추가 raw 데이터 — DB 저장 X, preview 응답에만 */
  rawData?: Record<string, any>;
}

export interface CrawledVariant {
  size?: string;
  color?: string;
  stock?: number;
}

/** 크롤링 작업 설정 */
export interface CrawlConfig {
  sourceSite: string;
  targetUrl: string;
  maxItems?: number;      // 최대 수집 상품 수
  delayMs?: number;       // 요청 간 딜레이 (ms)
  headers?: Record<string, string>;
}

/** 크롤링 작업 결과 */
export interface CrawlResult {
  success: boolean;
  totalItems: number;
  successItems: number;
  failedItems: number;
  products: CrawledProduct[];
  errors: string[];
}

/** 크롤러 인터페이스 */
export interface ICrawler {
  readonly sourceSite: string;
  crawl(config: CrawlConfig): Promise<CrawlResult>;
  parseProductList(html: string): string[];  // 상품 URL 목록 추출
  parseProductDetail(html: string, url: string): CrawledProduct | null;  // 상품 상세 파싱
}

/** import 옵션 — initialStatus 등 */
export interface ImportOptions {
  /** 신규 상품의 초기 status. 기본 DRAFT (검수 대기) */
  initialStatus?: "DRAFT" | "ACTIVE";
}

