import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ChevronRight,
  Calendar,
  Eye,
  User,
  ArrowLeft,
  Share2,
} from "lucide-react";
import { getPublishedMagazines } from "@/lib/queries";

export default async function MagazineDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const article = await prisma.magazine.findUnique({
    where: { slug },
  });

  if (!article || !article.isPublished) return notFound();

  // 조회수 증가 (fire & forget)
  prisma.magazine
    .update({ where: { id: article.id }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  // 관련 매거진 (같은 태그 기반, 본인 제외)
  const related = await getPublishedMagazines(4);
  const relatedArticles = related.filter((a) => a.id !== article.id).slice(0, 3);

  const publishedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs text-gray-400 mb-6">
        <Link href="/" className="hover:text-black">
          홈
        </Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/magazine" className="hover:text-black">
          매거진
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-black font-medium truncate max-w-[200px]">
          {article.title}
        </span>
      </div>

      <article className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {article.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-[10px] rounded-full"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-4">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="text-gray-500 text-base md:text-lg leading-relaxed mb-6">
              {article.excerpt}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-gray-400">
            {article.author && (
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {article.author}
              </span>
            )}
            {publishedDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {publishedDate}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {article.viewCount.toLocaleString()}
            </span>
          </div>
        </header>

        {/* Cover Image */}
        <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-gray-100 mb-10">
          <Image
            src={article.coverImage}
            alt={article.title}
            fill
            className="object-cover"
            priority
          />
        </div>

        <Separator className="mb-10" />

        {/* Content */}
        <div className="prose prose-sm md:prose-base max-w-none prose-headings:font-bold prose-p:text-gray-700 prose-p:leading-relaxed prose-img:rounded-xl prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline whitespace-pre-line leading-relaxed text-gray-700">
          {article.content}
        </div>

        <Separator className="my-10" />

        {/* Bottom Actions */}
        <div className="flex items-center justify-between mb-10">
          <Link
            href="/magazine"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            목록으로
          </Link>
          <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors">
            <Share2 className="w-4 h-4" />
            공유하기
          </button>
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-5">관련 매거진</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {relatedArticles.map((related) => (
                <Link
                  key={related.id}
                  href={`/magazine/${related.slug}`}
                  className="group"
                >
                  <div className="aspect-[3/2] rounded-xl overflow-hidden bg-gray-100 mb-3">
                    <Image
                      src={related.coverImage}
                      alt={related.title}
                      width={400}
                      height={267}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  {related.tags[0] && (
                    <Badge
                      variant="outline"
                      className="text-[10px] mb-1.5 rounded-full"
                    >
                      {related.tags[0]}
                    </Badge>
                  )}
                  <h3 className="font-bold text-sm group-hover:underline line-clamp-2">
                    {related.title}
                  </h3>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
