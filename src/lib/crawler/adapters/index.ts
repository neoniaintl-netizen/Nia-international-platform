import type { Platform } from "../engine/types";
import type { Adapter } from "../engine/base-crawler";
import { ShopifyAdapter } from "./shopify";
import { Cafe24Adapter } from "./cafe24";
import { GodomallAdapter } from "./godomall";

/** platform → 어댑터 인스턴스. custom/playwright는 Phase 3에서 확장. */
export function getAdapter(platform: Platform): Adapter {
  switch (platform) {
    case "shopify":
      return new ShopifyAdapter();
    case "cafe24":
      return new Cafe24Adapter();
    case "godomall":
      return new GodomallAdapter();
    default:
      throw new Error(`어댑터 미구현 platform: ${platform} (Phase 3 대상)`);
  }
}
