import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

/**
 * GET /api/admin/setup?key=nkbus2026
 *
 * NKBUS 어드민 계정 초기 셋업 (1회용)
 * admin@nkbus.com 계정이 이미 존재하면 스킵
 */
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (key !== "nkbus2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // nkbus 어드민이 이미 있는지 확인
    const existingAdmin = await prisma.user.findFirst({
      where: { email: "admin@nkbus.com" },
    });

    if (existingAdmin) {
      return NextResponse.json({
        message: "NKBUS 어드민 계정이 이미 존재합니다.",
        admin: {
          email: existingAdmin.email,
          name: existingAdmin.name,
          role: existingAdmin.role,
        },
      });
    }

    // 어드민 계정 생성
    const passwordHash = await bcrypt.hash("nkbus1234!", 12);

    const admin = await prisma.user.create({
      data: {
        email: "admin@nkbus.com",
        name: "NKBUS 관리자",
        nickname: "admin",
        passwordHash,
        role: "ADMIN",
      },
    });

    return NextResponse.json({
      success: true,
      message: "어드민 계정 생성 완료",
      admin: {
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
      credentials: {
        email: "admin@nkbus.com",
        password: "nkbus1234!",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
