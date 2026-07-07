import { createHash } from "node:crypto";

/** content_hash 입력 — 가격 + 품절 + 옵션. 변경 감지의 진실 소스. */
export interface HashInput {
  originalPrice: number;
  salePrice?: number | null;
  soldOut: boolean;
  options: string[];
}

/** 가격/품절/옵션을 정규화해 안정적인 32자 해시 생성. 옵션 순서 무관. */
export function contentHash(i: HashInput): string {
  const norm = JSON.stringify({
    o: i.originalPrice,
    s: i.salePrice ?? null,
    x: i.soldOut,
    p: [...i.options].sort(),
  });
  return createHash("sha256").update(norm).digest("hex").slice(0, 32);
}
