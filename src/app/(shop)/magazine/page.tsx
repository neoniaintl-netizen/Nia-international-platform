import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getPublishedMagazines } from "@/lib/queries";

export default async function MagazinePage() {
  const articles = await getPublishedMagazines(6);
  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-6">
      <h1 className="text-xl font-bold mb-6">매거진</h1>

      {/* Featured */}
      {featured && (
        <Link href={`/magazine/${featured.slug}`} className="block mb-8 group">
          <div className="relative aspect-[21/9] rounded-xl overflow-hidden bg-gray-900">
            <Image
              src={featured.coverImage}
              alt={featured.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-70"
            />
            <div className="absolute inset-0 flex items-end p-6 md:p-10">
              <div className="text-white">
                <Badge className="bg-white/20 text-white mb-3">FEATURED</Badge>
                <h2 className="text-2xl md:text-3xl font-bold">{featured.title}</h2>
                {featured.excerpt && (
                  <p className="text-white/60 mt-2 text-sm md:text-base">{featured.excerpt}</p>
                )}
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Article grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {rest.map((article) => (
          <Link key={article.id} href={`/magazine/${article.slug}`} className="group">
            <div className="aspect-[3/2] rounded-xl overflow-hidden bg-gray-100 mb-3">
              <Image
                src={article.coverImage}
                alt={article.title}
                width={600}
                height={400}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            {article.tags[0] && (
              <Badge variant="outline" className="text-[10px] mb-2">{article.tags[0]}</Badge>
            )}
            <h3 className="font-bold text-sm group-hover:underline">{article.title}</h3>
            {article.excerpt && (
              <p className="text-xs text-gray-400 mt-1">{article.excerpt}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
