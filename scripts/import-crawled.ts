/**
 * 무신사 크롤링 → DB 저장 실험
 *
 * PrismaPg 어댑터 로컬 호환 이슈로 node-postgres(pg) 직접 사용
 */
import pg from "pg";
import { MusinsaCrawler } from "../src/lib/crawler/musinsa-crawler";

const TARGET_URL = "https://www.musinsa.com/products/999602";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[가-힣]/g, (ch) =>
      encodeURIComponent(ch).replace(/%/g, "").toLowerCase()
    )
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `product-${Date.now()}`;
}

function genId(): string {
  // cuid-like ID 생성
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 10);
  return `crawl${t}${r}`;
}

async function main() {
  const pool = new pg.Pool({
    host: "localhost",
    port: 5432,
    database: "musinsa_mvp",
    user: "dooya8787",
  });

  const crawler = new MusinsaCrawler();

  console.log("🕷️  무신사 → DB 저장 실험\n");

  // ── 1) 크롤링 ──
  console.log("1) 크롤링 중...");
  const res = await fetch(TARGET_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "ko-KR,ko;q=0.9",
    },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const product = crawler.parseProductDetail(html, TARGET_URL);
  if (!product) throw new Error("파싱 실패!");

  console.log(`   ✅ ${product.name} (${product.brandName})`);
  console.log(`      ${product.originalPrice.toLocaleString()}원 → ${product.salePrice?.toLocaleString() || "-"}원`);
  console.log(`      이미지 ${product.imageUrls.length}개\n`);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ── 2) 중복 확인 ──
    const dupCheck = await client.query(
      `SELECT id, name FROM products WHERE "sourceUrl" = $1`,
      [product.sourceUrl]
    );
    if (dupCheck.rows.length > 0) {
      console.log(`⚠️  이미 존재: ${dupCheck.rows[0].name} (${dupCheck.rows[0].id})`);
      await client.query("ROLLBACK");
      return;
    }

    // ── 3) 브랜드 upsert ──
    console.log("2) 브랜드 처리...");
    let brandResult = await client.query(
      `SELECT id, name FROM brands WHERE name = $1`,
      [product.brandName]
    );

    let brandId: string;
    if (brandResult.rows.length > 0) {
      brandId = brandResult.rows[0].id;
      console.log(`   ♻️  기존 브랜드: ${product.brandName} (${brandId})`);
    } else {
      brandId = genId();
      await client.query(
        `INSERT INTO brands (id, name, "nameKo", slug, "isActive", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, true, NOW(), NOW())`,
        [brandId, product.brandName, product.brandName, slugify(product.brandName)]
      );
      console.log(`   ✅ 새 브랜드: ${product.brandName} (${brandId})`);
    }

    // ── 4) 카테고리 매칭 ──
    console.log("3) 카테고리 매칭...");
    let catResult = await client.query(
      `SELECT id, name FROM categories WHERE name ILIKE $1 LIMIT 1`,
      [`%${product.categoryName || "티셔츠"}%`]
    );

    if (catResult.rows.length === 0) {
      catResult = await client.query(
        `SELECT id, name FROM categories WHERE name ILIKE '%상의%' LIMIT 1`
      );
    }
    if (catResult.rows.length === 0) {
      catResult = await client.query(
        `SELECT id, name FROM categories ORDER BY "sortOrder" LIMIT 1`
      );
    }

    const categoryId = catResult.rows[0].id;
    console.log(`   ✅ 카테고리: ${catResult.rows[0].name} (${categoryId})`);

    // ── 5) 상품 생성 ──
    console.log("4) 상품 저장...");
    const productId = genId();
    const slug = slugify(product.name) + `-${Date.now().toString(36)}`;

    await client.query(
      `INSERT INTO products
       (id, "brandId", "categoryId", name, slug, description, "originalPrice", "salePrice",
        status, "isNew", "isBest", "viewCount", "reviewCount", "reviewAvg",
        "sourceUrl", "sourceSite", "crawledAt", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8,
        'ACTIVE', true, false, 0, 0, 0,
        $9, $10, NOW(), NOW(), NOW())`,
      [
        productId, brandId, categoryId, product.name, slug,
        product.description || null,
        product.originalPrice,
        product.salePrice || null,
        product.sourceUrl, product.sourceSite,
      ]
    );
    console.log(`   ✅ 상품 생성: ${product.name} (${productId})`);

    // ── 6) 이미지 저장 ──
    console.log(`5) 이미지 ${product.imageUrls.length}개 저장...`);
    for (let i = 0; i < product.imageUrls.length; i++) {
      await client.query(
        `INSERT INTO product_images (id, "productId", url, alt, "sortOrder", "isMain")
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [genId(), productId, product.imageUrls[i], product.name, i, i === 0]
      );
    }
    console.log(`   ✅ 이미지 ${product.imageUrls.length}개 저장 완료`);

    // ── 7) FREE 사이즈 변형 ──
    console.log("6) 변형 생성...");
    await client.query(
      `INSERT INTO product_variants (id, "productId", sku, size, stock, "isActive")
       VALUES ($1, $2, $3, 'FREE', 100, true)`,
      [genId(), productId, `MUSINSA-STD-WHITE-FREE`]
    );
    console.log("   ✅ FREE 사이즈 변형 생성");

    await client.query("COMMIT");

    // ── 결과 확인 ──
    const result = await client.query(
      `SELECT p.*, b.name as brand_name, c.name as category_name
       FROM products p
       JOIN brands b ON p."brandId" = b.id
       JOIN categories c ON p."categoryId" = c.id
       WHERE p.id = $1`,
      [productId]
    );

    const imgCount = await client.query(
      `SELECT count(*) FROM product_images WHERE "productId" = $1`,
      [productId]
    );

    const row = result.rows[0];
    console.log("\n" + "━".repeat(50));
    console.log("🎉 DB 저장 완료!");
    console.log("━".repeat(50));
    console.log(`ID:        ${row.id}`);
    console.log(`상품명:    ${row.name}`);
    console.log(`Slug:      ${row.slug}`);
    console.log(`브랜드:    ${row.brand_name}`);
    console.log(`카테고리:  ${row.category_name}`);
    console.log(`정가:      ${Number(row.originalPrice).toLocaleString()}원`);
    console.log(`할인가:    ${row.salePrice ? Number(row.salePrice).toLocaleString() + "원" : "-"}`);
    console.log(`이미지:    ${imgCount.rows[0].count}개`);
    console.log(`상태:      ${row.status}`);
    console.log(`소스:      ${row.sourceUrl}`);
    console.log(`크롤링:    ${row.crawledAt}`);
    console.log("━".repeat(50));

    // 총 상품 수
    const total = await client.query(`SELECT count(*) FROM products`);
    console.log(`\n📊 전체 상품 수: ${total.rows[0].count}개 (크롤링 상품 포함)`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("❌ 에러:", err.message || err);
  process.exit(1);
});
