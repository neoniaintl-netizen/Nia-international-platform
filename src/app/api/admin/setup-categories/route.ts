import { NextRequest, NextResponse } from "next/server";
import { requireOpsToken } from "@/lib/ops-auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/admin/setup-categories?token=<ADMIN_OPS_TOKEN>
 *
 * 홈페이지에서 참조하는 5개 확장 카테고리(골프/스포츠/아웃도어/뷰티/여성의류)를
 * DB에 idempotent하게 생성한다. 이미 있으면 skip.
 */
export async function GET(req: NextRequest) {
  const block = requireOpsToken(req);
  if (block) return block;

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
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
