import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

/**
 * GET /api/admin/setup?key=nkbus2026
 *
 * NKBUS 어드민 계정 셋업
 * - 계정 없으면 생성
 * - 계정 있으면 비밀번호 리셋 + role을 ADMIN으로 보장
 */
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (key !== "nkbus2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const EMAIL = "admin@nkbus.com";
  const PASSWORD = "nkbus1234!";

  try {
    const passwordHash = await bcrypt.hash(PASSWORD, 12);

    const existingAdmin = await prisma.user.findFirst({
      where: { email: EMAIL },
    });

    if (existingAdmin) {
      // 기존 계정 → 비밀번호 리셋 + role ADMIN 보장
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          passwordHash,
          role: "ADMIN",
        },
      });

      return NextResponse.json({
        success: true,
        message: "어드민 계정 비밀번호 리셋 및 권한 확인 완료",
        admin: {
          id: existingAdmin.id,
          email: EMAIL,
          name: existingAdmin.name,
          role: "ADMIN",
        },
        credentials: { email: EMAIL, password: PASSWORD },
      });
    }

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

    return NextResponse.json({
      success: true,
      message: "어드민 계정 신규 생성 완료",
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
      credentials: { email: EMAIL, password: PASSWORD },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
