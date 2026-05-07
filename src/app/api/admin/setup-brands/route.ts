import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";

/**
 * GET /api/admin/setup-brands
 *
 * 아웃도어 5 + 스포츠 4 브랜드를 idempotent하게 Brand 테이블에 등록.
 * 이미 있으면 nameKo/description만 업데이트.
 */

const BRANDS = [
  // ── 아웃도어 ──
  {
    slug: "salomon",
    name: "Salomon",
    nameKo: "살로몬",
    description: "프랑스 발 기술력의 아웃도어·트레일러닝 브랜드",
    defaultCategory: "outdoor",
  },
  {
    slug: "patagonia",
    name: "Patagonia",
    nameKo: "파타고니아",
    description: "환경을 위한 가장 따뜻한 아웃도어",
    defaultCategory: "outdoor",
  },
  {
    slug: "arcteryx",
    name: "Arc'teryx",
    nameKo: "아크테릭스",
    description: "캐나다 밴쿠버 프리미엄 알파인 아웃도어",
    defaultCategory: "outdoor",
  },
  {
    slug: "thenorthface",
    name: "The North Face",
    nameKo: "노스페이스",
    description: "Never Stop Exploring — 프리미엄 아웃도어의 정석",
    defaultCategory: "outdoor",
  },
  {
    slug: "kolonsport",
    name: "Kolon Sport",
    nameKo: "코오롱스포츠",
    description: "국내 1세대 프리미엄 아웃도어 브랜드",
    defaultCategory: "outdoor",
  },

  // ── 스포츠 ──
  {
    slug: "descente",
    name: "Descente",
    nameKo: "데상트",
    description: "일본 퍼포먼스 스포츠의 정체성",
    defaultCategory: "sports",
  },
  {
    slug: "wilson",
    name: "Wilson",
    nameKo: "윌슨",
    description: "테니스·골프 퍼포먼스의 글로벌 리더",
    defaultCategory: "sports",
  },
  {
    slug: "aloyoga",
    name: "Alo Yoga",
    nameKo: "알로요가",
    description: "LA 요가·피트니스 라이프스타일",
    defaultCategory: "sports",
  },
  {
    slug: "nike-skims",
    name: "Nike × SKIMS",
    nameKo: "나이키 × 스킴스",
    description: "나이키와 스킴스의 여성 퍼포먼스 컬래버",
    defaultCategory: "sports",
  },
] as const;

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const results = [];
    for (const b of BRANDS) {
      const brand = await prisma.brand.upsert({
        where: { slug: b.slug },
        update: {
          nameKo: b.nameKo,
          description: b.description,
        },
        create: {
          slug: b.slug,
          name: b.name,
          nameKo: b.nameKo,
          description: b.description,
          isActive: true,
          followerCount: 1000,
        },
      });
      results.push({
        slug: brand.slug,
        id: brand.id,
        name: brand.name,
        nameKo: brand.nameKo,
      });
    }

    return NextResponse.json({
      success: true,
      message: "브랜드 9개 등록 완료",
      brands: results,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
