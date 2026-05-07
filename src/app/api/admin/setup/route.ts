import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/auth-guards";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/admin/setup
 *
 * NKBUS 어드민 계정 셋업/비밀번호 리셋.
 *
 * 보안:
 * - ADMIN 세션 필요 (이미 가입된 ADMIN만 호출 가능)
 * - 추가로 `ADMIN_SETUP_TOKEN` env에 설정된 1회용 토큰을 `x-admin-setup-token` 헤더로 전달해야 함
 *   (env 미설정 시 라우트는 503으로 잠김)
 * - 자격증명(이메일/비밀번호)은 응답 본문에 절대 노출하지 않음
 *
 * 동작:
 * - 계정 없으면 기본 정보로 생성, 있으면 비밀번호 리셋 + ADMIN role 보장
 * - 운영에서 부트스트랩 후에는 Railway 환경변수에서 `ADMIN_SETUP_TOKEN`을 즉시 제거 권장
 */
export async function POST(req: NextRequest) {
  // 부트스트랩 라우트 — IP당 분당 5회로 엄격 제한
  const ip = getClientIp(req);
  const rl = await rateLimit(`admin-setup:${ip}`, {
    limit: 5,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too Many Requests" },
      { status: 429 }
    );
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const expectedToken = process.env.ADMIN_SETUP_TOKEN;
  if (!expectedToken) {
    return NextResponse.json(
      { error: "Setup is disabled (ADMIN_SETUP_TOKEN not set)" },
      { status: 503 }
    );
  }

  const providedToken = req.headers.get("x-admin-setup-token");
  if (providedToken !== expectedToken) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const EMAIL = "admin@nkbus.com";
  const PASSWORD = "nkbus1234!";

  try {
    const passwordHash = await bcrypt.hash(PASSWORD, 12);

    const existingAdmin = await prisma.user.findFirst({
      where: { email: EMAIL },
    });

    let userId: string;

    if (existingAdmin) {
      // 기존 계정 → 비밀번호 리셋 + role ADMIN 보장
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          passwordHash,
          role: "ADMIN",
        },
      });
      userId = existingAdmin.id;
      console.log(`[setup] admin user upserted (existing): ${userId}`);
    } else {
      // 신규 생성
      const admin = await prisma.user.create({
        data: {
          email: EMAIL,
          name: "NKBUS 관리자",
          nickname: "nkbus_admin",
          passwordHash,
          role: "ADMIN",
        },
      });
      userId = admin.id;
      console.log(`[setup] admin user upserted (created): ${userId}`);
    }

    // 자격증명은 절대 응답에 포함하지 않음
    return NextResponse.json({
      ok: true,
      userId,
    });
  } catch (err) {
    console.error("[setup] failed:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
