import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const ALLOWED_CATEGORIES = ["general", "review", "profile", "snap", "outfit"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const rawCategory = (formData.get("category") as string) || "general";
    const category = ALLOWED_CATEGORIES.includes(rawCategory) ? rawCategory : "general";

    if (!files.length) {
      return NextResponse.json({ error: "파일을 선택해주세요." }, { status: 400 });
    }

    if (files.length > 5) {
      return NextResponse.json({ error: "최대 5장까지 업로드 가능합니다." }, { status: 400 });
    }

    const urls: string[] = [];

    for (const file of files) {
      // 타입 검사
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `지원하지 않는 파일 형식입니다: ${file.type}` },
          { status: 400 }
        );
      }

      // 크기 검사
      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { error: "파일 크기는 5MB 이하여야 합니다." },
          { status: 400 }
        );
      }

      // 파일 저장 — 확장자는 검증된 MIME 타입에서 결정 (파일명 신뢰 안 함)
      const ext = EXT_BY_TYPE[file.type];
      const fileName = `${randomUUID()}.${ext}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", category);

      await mkdir(uploadDir, { recursive: true });

      const bytes = new Uint8Array(await file.arrayBuffer());
      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, bytes);

      urls.push(`/uploads/${category}/${fileName}`);
    }

    return NextResponse.json({ urls });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: "업로드에 실패했습니다." }, { status: 500 });
  }
}
