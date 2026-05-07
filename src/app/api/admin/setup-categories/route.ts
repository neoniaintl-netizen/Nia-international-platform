import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";

/**
 * GET /api/admin/setup-categories
 *
 * 홈페이지에서 참조하는 5개 확장 카테고리(골프/스포츠/아웃도어/뷰티/여성의류)를
 * DB에 idempotent하게 생성한다. 이미 있으면 skip.
 */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const EXPANSION_CATEGORIES = [
    { name: "골프", slug: "golf", sortOrder: 9 },
    { name: "스포츠", slug: "sports", sortOrder: 10 },
    { name: "아웃도어", slug: "outdoor", sortOrder: 11 },
    { name: "뷰티", slug: "beauty", sortOrder: 12 },
    { name: "여성의류", slug: "women", sortOrder: 13 },
  ];

  try {
    const results = [];
    for (const c of EXPANSION_CATEGORIES) {
      const result = await prisma.category.upsert({
        where: { slug: c.slug },
        update: { name: c.name, sortOrder: c.sortOrder },
        create: {
          name: c.name,
          slug: c.slug,
          depth: 0,
          sortOrder: c.sortOrder,
        },
      });
      results.push({ slug: result.slug, id: result.id, name: result.name });
    }

    return NextResponse.json({
      success: true,
      message: "확장 카테고리 5개 설정 완료",
      categories: results,
    });
  } catch (err) {
    console.error("[setup-categories]", err);
    return NextResponse.json(
      { error: "카테고리 설정에 실패했습니다." },
      { status: 500 }
    );
  }
}
