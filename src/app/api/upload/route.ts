import { writeFile, mkdir } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { randomUUID } from "crypto";
import { requireAdmin } from "@/lib/auth-guards";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_EXTS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const ALLOWED_CATEGORIES = new Set([
  "products",
  "brands",
  "banners",
  "general",
  "categories",
  "hero",
]);
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  // 어드민 전용. 추후 일반 유저용 업로드(프로필 사진 등)가 필요하면
  // 별도 라우트(예: /api/upload/profile)로 분리하고 카테고리는 고정값 사용.
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const rawCategory = (formData.get("category") as string) || "general";

    // 카테고리 화이트리스트 검증 — path traversal 차단
    if (!ALLOWED_CATEGORIES.has(rawCategory)) {
      return NextResponse.json(
        { error: "허용되지 않은 카테고리입니다." },
        { status: 400 }
      );
    }
    const category = rawCategory; // 화이트리스트 검증 완료

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

      // 확장자 화이트리스트 — 사용자 제공 파일명에 신뢰 금지
      const rawExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const ext = ALLOWED_EXTS.has(rawExt) ? rawExt : "jpg";

      // 파일 저장 — fileName/category 모두 안전한 값만 사용
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
