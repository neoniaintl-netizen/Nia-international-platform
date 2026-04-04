/** 크롤링된 상품 원시 데이터 */
export interface CrawledProduct {
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
