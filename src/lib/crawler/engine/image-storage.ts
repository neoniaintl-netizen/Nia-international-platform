// 이미지 스토리지 추상화 — 로컬 FS(기존 프로젝트 방식) + Cloudflare R2(프로덕션).
// R2 env 가 모두 있으면 R2, 아니면 로컬 FS(public/uploads/crawled).
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

export interface Uploader {
  readonly kind: string;
  /** key 로 body 업로드 후 공개 URL 반환. */
  upload(key: string, body: Buffer, contentType: string): Promise<string>;
}

/** 로컬 FS — public/uploads/crawled/. 서빙 호스트와 동일할 때 유효(개발/온서버 크론). */
export class LocalUploader implements Uploader {
  readonly kind = "local";
  constructor(
    private baseDir = path.resolve(process.cwd(), "public/uploads/crawled"),
    private publicBase = "/uploads/crawled",
  ) {}
  async upload(key: string, body: Buffer): Promise<string> {
    const full = path.join(this.baseDir, key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, body);
    return `${this.publicBase}/${key}`;
  }
}

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl: string;
}

/** Cloudflare R2 (S3 호환). 프로덕션 오프서버 크롤러용. @aws-sdk/client-s3 필요. */
export class R2Uploader implements Uploader {
  readonly kind = "r2";
  constructor(private cfg: R2Config) {}
  async upload(key: string, body: Buffer, contentType: string): Promise<string> {
    // 비-리터럴 specifier 로 동적 import → 미설치 시 tsc 영향 없음, 런타임에만 필요.
    const pkg = "@aws-sdk/client-s3";
    let mod: {
      S3Client: new (o: unknown) => { send: (c: unknown) => Promise<unknown> };
      PutObjectCommand: new (o: unknown) => unknown;
    };
    try {
      mod = (await import(pkg)) as unknown as typeof mod;
    } catch {
      throw new Error("R2 사용하려면 @aws-sdk/client-s3 설치 필요 (npm@10 절차)");
    }
    const client = new mod.S3Client({
      region: "auto",
      endpoint: `https://${this.cfg.accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: this.cfg.accessKeyId, secretAccessKey: this.cfg.secretAccessKey },
    });
    await client.send(
      new mod.PutObjectCommand({ Bucket: this.cfg.bucket, Key: key, Body: body, ContentType: contentType }),
    );
    return `${this.cfg.publicBaseUrl.replace(/\/$/, "")}/${key}`;
  }
}

/** env 기반 uploader 선택. R2 env 완비 시 R2, 아니면 로컬 FS. */
export function getUploader(): Uploader {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL } = process.env;
  if (R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET && R2_PUBLIC_URL) {
    return new R2Uploader({
      accountId: R2_ACCOUNT_ID,
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
      bucket: R2_BUCKET,
      publicBaseUrl: R2_PUBLIC_URL,
    });
  }
  return new LocalUploader();
}
