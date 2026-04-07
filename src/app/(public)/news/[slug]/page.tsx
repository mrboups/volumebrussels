import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const article = await db.article.findUnique({ where: { slug } });
  if (!article || !article.isPublished) notFound();

  const formattedDate = article.publishedAt.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      {/* Cover image with title overlay */}
      <div className="relative w-full h-96 bg-gray-200">
        {article.coverImage ? (
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-300">
            <span className="text-gray-500 text-sm uppercase tracking-wide">
              No Image
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
          <p className="text-white/70 text-sm mb-2">{formattedDate}</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
            {article.title}
          </h1>
        </div>
      </div>

      {/* Article content */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {article.summary && (
          <p className="text-xl text-gray-600 leading-relaxed mb-8 border-l-4 border-gray-200 pl-4">
            {article.summary}
          </p>
        )}

        <div className="text-gray-800 text-lg leading-relaxed space-y-4">
          {article.content.split("\n").map((line, i) => {
            const trimmed = line.trim();
            if (!trimmed) return <br key={i} />;

            // Image URL on its own line
            if (/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(trimmed)) {
              return <img key={i} src={trimmed} alt="" className="w-full rounded-lg my-4" />;
            }

            // Render line with auto-linked URLs
            const parts = trimmed.split(/(https?:\/\/[^\s]+)/g);
            return (
              <p key={i}>
                {parts.map((part, j) =>
                  /^https?:\/\//.test(part) ? (
                    <a key={j} href={part} target="_blank" rel="noopener noreferrer" className="text-[#1a7fc7] hover:underline break-all">
                      {part}
                    </a>
                  ) : (
                    <span key={j}>{part}</span>
                  )
                )}
              </p>
            );
          })}
        </div>

        <div className="mt-16 pt-8 border-t border-gray-200">
          <Link
            href="/"
            className="inline-block text-sm font-medium text-gray-500 hover:text-black transition-colors"
          >
            &larr; Back to home
          </Link>
        </div>
      </article>
    </>
  );
}
