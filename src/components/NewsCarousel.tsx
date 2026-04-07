"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  coverImage: string | null;
  publishedAt: string;
}

export default function NewsCarousel({ articles }: { articles: Article[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  const scrollNext = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const cardWidth = container.firstElementChild
      ? (container.firstElementChild as HTMLElement).offsetWidth + 16
      : 366;

    const maxScroll = container.scrollWidth - container.clientWidth;

    if (container.scrollLeft >= maxScroll - 10) {
      container.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      container.scrollBy({ left: cardWidth, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    if (isPaused || articles.length === 0) return;
    const id = setInterval(scrollNext, 4000);
    return () => clearInterval(id);
  }, [isPaused, scrollNext, articles.length]);

  if (articles.length === 0) return null;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <style dangerouslySetInnerHTML={{ __html: `.news-carousel-scroll::-webkit-scrollbar { display: none; }` }} />
      <div
        ref={scrollRef}
        className="news-carousel-scroll flex gap-4 overflow-x-scroll px-4 sm:px-6 lg:px-8"
        style={{
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/news/${article.slug}`}
            className="flex-shrink-0 w-[280px] sm:w-[350px] rounded-xl overflow-hidden relative group"
            style={{ scrollSnapAlign: "start" }}
          >
            <div className="relative h-72 sm:h-80 bg-gray-200">
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="text-white font-bold text-lg leading-tight">
                  {article.title}
                </h3>
                {article.summary && (
                  <p className="text-white/80 text-sm mt-2 line-clamp-2">
                    {article.summary.slice(0, 100)}
                    {article.summary.length > 100 ? "..." : ""}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
