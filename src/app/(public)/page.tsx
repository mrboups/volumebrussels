import Link from "next/link";
import Image from "next/image";
import PricingCard from "@/components/PricingCard";
import VideoOverlay from "@/components/VideoOverlay";
import EmbedSocial from "@/components/EmbedSocial";
import NewsCarousel from "@/components/NewsCarousel";
import { db } from "@/lib/db";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  // Title inherits the root default ("Volume Brussels | One night access pass...")
  alternates: { canonical: "https://volumebrussels.com/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

/* ── Agenda types & helpers ── */

interface MediaItem {
  type: string;
  link: string;
}

interface AgendaEvent {
  id: string;
  date_start: string;
  is_soldout: boolean;
  is_canceled: boolean;
  translations: {
    en?: { name?: string };
    fr?: { name?: string };
    nl?: { name?: string };
  };
  place?: {
    translations?: {
      en?: { name?: string };
    };
  };
  media?: MediaItem[];
}

async function getEvents(): Promise<AgendaEvent[]> {
  try {
    const res = await fetch(
      "https://api.agenda.be/event/search?volume_brussels=1&size=10",
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data || [])
      .filter((e: AgendaEvent) => e.date_start)
      .sort((a: AgendaEvent, b: AgendaEvent) =>
        a.date_start.localeCompare(b.date_start)
      );
  } catch {
    return [];
  }
}

function getEventImage(event: AgendaEvent): string {
  if (!event.media || !Array.isArray(event.media)) return "";
  const poster = event.media.find((m) => m.type === "poster");
  if (poster?.link) return poster.link;
  const photo = event.media.find((m) => m.type === "photo");
  return photo?.link || "";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ── Bullet points ── */

const bulletPoints = [
  "Skip line exclusive access",
  "Official Tourism Office offer",
  "Use or refund at anytime",
  "7/7 Live Support Chat",
];

/* ── Page ── */

export default async function HomePage() {
  let clubs: Awaited<ReturnType<typeof db.club.findMany>> = [];
  let museums: Awaited<ReturnType<typeof db.museum.findMany>> = [];
  let articles: Awaited<ReturnType<typeof db.article.findMany>> = [];

  try {
    clubs = await db.club.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    museums = await db.museum.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    articles = await db.article.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: "asc" },
      take: 10,
    });
  } catch {
    // DB not reachable during build
  }

  const events = await getEvents();

  return (
    <>
      {/* ═══ 1. Hero Section ═══ */}
      <section className="bg-[#1a7fc7] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 flex flex-col lg:flex-row items-center gap-12">
          {/* Left copy */}
          <div className="flex-1 max-w-xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light leading-tight">
              Brussels Nightlife in One Pass
            </h1>
            <p className="mt-6 text-lg leading-relaxed opacity-90">
              Enjoy 24&nbsp;h or 48&nbsp;h access to 9 nightclubs, the iconic
              Atomium, Brussels Design Museum, and 4 more museums.
            </p>
            <ul className="mt-6 space-y-2">
              {bulletPoints.map((point) => (
                <li
                  key={point}
                  className="flex items-center gap-3 text-sm font-medium"
                >
                  <span className="text-white/80">&#8226;</span>
                  {point}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex items-center gap-6">
              <Link
                href="/buy-ticket"
                className="inline-block bg-white text-[#1a7fc7] font-bold uppercase tracking-wide text-sm px-8 py-3.5 rounded-full hover:bg-gray-100 transition-colors"
              >
                Buy Now
              </Link>
              <VideoOverlay />
            </div>
          </div>

          {/* Right — hero image */}
          <div className="flex-1 w-full max-w-md lg:max-w-lg">
            <Image
              src="/hero.png"
              alt="Brussels nightlife"
              width={600}
              height={500}
              className="w-full h-auto"
              priority
            />
          </div>
        </div>
      </section>

      {/* ═══ News Carousel ═══ */}
      {articles.length > 0 && (
        <section className="py-12 lg:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-light mb-8">News</h2>
          </div>
          <NewsCarousel
            articles={articles.map((a) => ({
              id: a.id,
              title: a.title,
              slug: a.slug,
              summary: a.summary,
              coverImage: a.coverImage,
              publishedAt: a.publishedAt.toISOString(),
            }))}
          />
        </section>
      )}

      {/* ═══ 2. Agenda Section ═══ */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-light">Agenda</h2>

          {events.length === 0 ? (
            <p className="mt-12 text-center text-gray-400">
              No events found, try adjusting your search and filters.
            </p>
          ) : (
            <>
              <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {events.slice(0, 6).map((event) => {
                  const name =
                    event.translations?.en?.name ||
                    event.translations?.fr?.name ||
                    event.translations?.nl?.name ||
                    "Untitled";
                  const venue =
                    event.place?.translations?.en?.name || "";
                  const image =
                    getEventImage(event);

                  return (
                    <div
                      key={event.id}
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      {image ? (
                        <div className="relative w-full h-48 bg-gray-200">
                          <img
                            src={image}
                            alt={name}
                            className="w-full h-full object-cover"
                          />
                          {event.is_soldout && (
                            <span className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold uppercase px-3 py-1 tracking-wide">
                              Sold Out
                            </span>
                          )}
                          {event.is_canceled && (
                            <span className="absolute top-3 right-3 bg-gray-800 text-white text-xs font-bold uppercase px-3 py-1 tracking-wide">
                              Canceled
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="relative w-full h-48 bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-sm uppercase tracking-wide">
                            No Image
                          </span>
                        </div>
                      )}

                      <div className="p-5">
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
                          {formatDate(event.date_start)}
                        </p>
                        <h3 className="text-lg font-extrabold mt-1">
                          {name}
                        </h3>
                        {venue && (
                          <p className="text-sm text-gray-500 mt-1">
                            {venue}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-10 text-center">
                <Link
                  href="/agenda"
                  className="inline-block border-2 border-black text-black text-sm font-semibold uppercase tracking-wide px-8 py-3 rounded-full hover:bg-black hover:text-white transition-colors"
                >
                  View more
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ═══ 3. A Whole City Experience ═══ */}
      <section className="py-16 lg:py-20 bg-[#1a7fc7] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-normal text-center">
            A Whole City Experience
          </h2>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 — Clubs */}
            <Link href="/offer" className="group bg-white rounded-2xl overflow-hidden text-gray-900 hover:shadow-2xl transition-shadow">
              <div className="w-full h-64 relative overflow-hidden">
                <img
                  src="/city/clubs.jpeg"
                  alt="9 Clubs"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-sm font-semibold px-6 py-2.5 rounded">
                    View
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold">9 Clubs</h3>
                <p className="mt-1 text-gray-500 text-sm leading-relaxed">
                  Dance the night away in 9 clubs: electro, techno, afro, latino.
                </p>
              </div>
            </Link>

            {/* Card 2 — Atomium */}
            <Link href="/offer" className="group bg-white rounded-2xl overflow-hidden text-gray-900 hover:shadow-2xl transition-shadow">
              <div className="w-full h-64 relative overflow-hidden">
                <img
                  src="/city/atomium.jpeg"
                  alt="Atomium & Brussels Design Museum"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-sm font-semibold px-6 py-2.5 rounded">
                    View
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold">
                  Atomium &amp; Brussels Design Museum
                </h3>
                <p className="mt-1 text-gray-500 text-sm leading-relaxed">
                  Explore the iconic Atomium and the Design Museum.
                </p>
              </div>
            </Link>

            {/* Card 3 — Museums */}
            <Link href="/museums" className="group bg-white rounded-2xl overflow-hidden text-gray-900 hover:shadow-2xl transition-shadow">
              <div className="w-full h-64 relative overflow-hidden">
                <img
                  src="/city/museums.png"
                  alt="4 Brussels Museums"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-sm font-semibold px-6 py-2.5 rounded">
                    View
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold">4 Brussels Museums</h3>
                <p className="mt-1 text-gray-500 text-sm leading-relaxed">
                  Discover 4 museums showcasing the city&apos;s rich history and
                  contemporary art scene.
                </p>
              </div>
            </Link>
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/buy-ticket"
              className="inline-block bg-white text-black text-sm font-semibold px-10 py-3.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              Buy Now
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ 4. What's On — EmbedSocial Instagram ═══ */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-light">{"What's On"}</h2>
          <div className="mt-8">
            <EmbedSocial />
          </div>
        </div>
      </section>

      {/* ═══ 5. Pricing Section ═══ */}
      <section id="pricing" className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-medium">
              Your all-access pass to the city: choose your option
            </h2>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row items-center sm:items-stretch justify-center gap-8">
            <PricingCard
              title="Night Pass"
              price="€29"
              subtitle="One night of clubbing."
              features={[
                "Skip Line Access to 2 Clubs",
                "Free Access to Atomium & Brussels Design Museum",
                "Free Access to 4 Brussels Museums",
              ]}
              filled={false}
              passType="night"
            />
            <PricingCard
              title="Weekend Pass"
              price="€48"
              subtitle="48h Clubbing Weekend"
              features={[
                "Free Unlimited Access to all clubs",
                "Free Access to Atomium & Brussels Design Museum",
                "Free Access to 4 Brussels Museums",
              ]}
              filled={true}
              passType="weekend"
            />
          </div>
        </div>
      </section>

      {/* ═══ 7. Partners Section ═══ */}
      <section className="py-16 lg:py-20 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xl sm:text-2xl font-light italic text-gray-600">
            They also love to party.
          </p>

          <div className="mt-12 flex items-center justify-center gap-16 sm:gap-24 flex-wrap">
            <img src="/sponsors/atomium.png" alt="Atomium" className="h-12 w-auto object-contain" />
            <img src="/sponsors/visitbrussels.jpeg" alt="visit.brussels" className="h-12 w-auto object-contain" />
            <img src="/sponsors/bxl.png" alt="BXL La Ville de Stad" className="h-12 w-auto object-contain" />
          </div>
        </div>
      </section>
    </>
  );
}
