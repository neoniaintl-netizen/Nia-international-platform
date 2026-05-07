import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { MusinsaCrawler } from "@/lib/crawler/musinsa-crawler";

/**
 * GET /api/admin/crawl-product?url=https://www.musinsa.com/products/999602
 *
 * 무신사 상품 1개를 크롤링 → DB에 저장하는 API
 * Railway 서버에서 실행되므로 internal DB 접속 가능
 */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const url = req.nextUrl.searchParams.get("url");

  if (!url || !url.includes("musinsa.com/products/")) {
    return NextResponse.json(
      { error: "url 파라미터 필요 (예: ?url=https://www.musinsa.com/products/999602)" },
      { status: 400 }
    );
  }

  try {
    // 1) 중복 확인
    const existing = await prisma.product.findFirst({
      where: { sourceUrl: url },
    });
    if (existing) {
      return NextResponse.json({
        success: true,
        message: "이미 존재하는 상품",
        product: { id: existing.id, name: existing.name, slug: existing.slug },
      });
    }

    // 2) 크롤링
    const crawler = new MusinsaCrawler();
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `무신사 HTTP ${res.status}` },
        { status: 502 }
      );
    }

    const html = await res.text();
    const product = crawler.parseProductDetail(html, url);

    if (!product) {
      return NextResponse.json(
        { error: "상품 파싱 실패" },
        { status: 500 }
      );
    }

    // 3) 브랜드 upsert
    let brand = await prisma.brand.findFirst({
      where: { name: product.brandName },
    });
    if (!brand) {
      brand = await prisma.brand.create({
        data: {
          name: product.brandName,
          nameKo: product.brandName,
          slug: slugify(product.brandName),
          isActive: true,
        },
      });
    }

    // 4) 카테고리 매칭
    let category = await prisma.category.findFirst({
      where: {
        name: { contains: product.categoryName || "상의", mode: "insensitive" },
      },
    });
    if (!category) {
      category = await prisma.category.findFirst({
        where: { slug: "tops" },
      });
    }
    if (!category) {
      category = await prisma.category.findFirst({
        orderBy: { sortOrder: "asc" },
      });
    }
    if (!category) {
      return NextResponse.json(
        { error: "카테고리 없음 - DB 시드 필요" },
        { status: 500 }
      );
    }

    // 5) 상품 생성
    const slug = slugify(product.name) + `-${Date.now().toString(36)}`;

    const created = await prisma.product.create({
      data: {
        brandId: brand.id,
        categoryId: category.id,
        name: product.name,
        slug,
        description: product.description,
        originalPrice: product.originalPrice,
        salePrice: product.salePrice,
        status: "ACTIVE",
        isNew: true,
        sourceUrl: product.sourceUrl,
        sourceSite: product.sourceSite,
        crawledAt: new Date(),
      },
    });

    // 6) 이미지
    if (product.imageUrls.length > 0) {
      await prisma.productImage.createMany({
        data: product.imageUrls.map((imgUrl, i) => ({
          productId: created.id,
          url: imgUrl,
          alt: product.name,
          sortOrder: i,
          isMain: i === 0,
        })),
      });
    }

    // 7) 기본 변형
    if (product.variants && product.variants.length > 0) {
      await prisma.productVariant.createMany({
        data: product.variants.map((v, i) => ({
          productId: created.id,
          sku: `${slug}-${v.size || v.color || i}`.toUpperCase().slice(0, 50),
          size: v.size,
          color: v.color,
          stock: v.stock ?? 100,
          isActive: true,
        })),
      });
    } else {
      await prisma.productVariant.create({
        data: {
          productId: created.id,
          sku: `${slug}-FREE`.toUpperCase().slice(0, 50),
          size: "FREE",
          stock: 100,
          isActive: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "크롤링 & 저장 완료",
      product: {
        id: created.id,
        name: created.name,
        slug: created.slug,
        brand: brand.name,
        category: category.name,
        originalPrice: created.originalPrice,
        salePrice: created.salePrice,
        images: product.imageUrls.length,
      },
    });
  } catch (err: any) {
    console.error("[Crawl Error]", err);
    return NextResponse.json(
      { error: err.message || "크롤링 실패" },
      { status: 500 }
    );
  }
}

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
