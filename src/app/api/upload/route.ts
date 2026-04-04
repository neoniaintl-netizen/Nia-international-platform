import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const category = (formData.get("category") as string) || "general";

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

      // 파일 저장
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
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
