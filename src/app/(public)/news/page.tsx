import { db } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NewsIndexPage() {
  const articles = await db.article.findMany({
    where: { isPublished: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <section className="py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-light">News</h1>

        {articles.length === 0 ? (
          <p className="mt-12 text-center text-gray-400">
            No articles published yet.
          </p>
        ) : (
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => {
              const formattedDate = article.publishedAt.toLocaleDateString(
                "en-GB",
                {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }
              );

              return (
                <Link
                  key={article.id}
                  href={`/news/${article.slug}`}
                  className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative w-full h-48 bg-gray-200">
                    {article.coverImage ? (
                      <img
                        src={article.coverImage}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-300">
                        <span className="text-gray-500 text-sm uppercase tracking-wide">
                          No Image
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
                      {formattedDate}
                    </p>
                    <h3 className="text-lg font-extrabold mt-1">
                      {article.title}
                    </h3>
                    {article.summary && (
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                        {article.summary}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-10">
          <Link
            href="/"
            className="inline-block text-sm text-gray-500 hover:text-black"
          >
            &larr; Back to home
          </Link>
        </div>
      </div>
    </section>
  );
}
