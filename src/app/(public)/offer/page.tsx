import OfferCard from "@/components/OfferCard";
import { db } from "@/lib/db";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Offer — Clubs and museums included in the Volume Pass",
  description:
    "Discover the Brussels clubs and museums you can access with your Volume Pass: Fuse, C12, Spirito, Mirano, Madame Moustache, Atomium and more.",
  alternates: { canonical: "https://volumebrussels.com/offer" },
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
  openGraph: {
    title: "Offer — Clubs and museums included in the Volume Pass",
    description:
      "Every club and museum you can access with one Volume Pass in Brussels.",
    url: "https://volumebrussels.com/offer",
    siteName: "Volume Brussels",
    type: "website",
    locale: "en_US",
    images: [{ url: "/hero.png", width: 1200, height: 630, alt: "Volume Brussels" }],
  },
};

export default async function OfferPage() {
  let clubs: Awaited<ReturnType<typeof db.club.findMany>> = [];
  let museums: Awaited<ReturnType<typeof db.museum.findMany>> = [];
  try {
    clubs = await db.club.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    museums = await db.museum.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  } catch {
    // DB not reachable during build
  }

  return (
    <section className="py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-extrabold">With your Volume Pass</h1>
          <p className="mt-3 text-gray-500 text-lg font-medium">
            Offers included to enjoy an unforgettable weekend in Brussels!
          </p>
        </div>

        {/* Clubs */}
        {clubs.length > 0 && (
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {clubs.map((club) => (
              <OfferCard
                key={club.id}
                name={club.name}
                description={club.description || ""}
                imageUrl={club.pictures?.[0]}
                musicTags={club.musicTags}
                dresscodeTags={club.dresscodeTags}
                openDays={club.openDays}
                openTime={club.openTime || undefined}
                closeTime={club.closeTime || undefined}
                instagramUrl={club.instagramUrl || undefined}
                facebookUrl={club.facebookUrl || undefined}
                websiteUrl={club.websiteUrl || undefined}
              />
            ))}
          </div>
        )}

        {/* Museums section */}
        {museums.length > 0 && (
          <>
            <div className="mt-20 max-w-2xl">
              <h2 className="text-3xl font-extrabold">Brussels City Museum Vouchers</h2>
              <p className="mt-3 text-gray-500 text-lg font-medium">
                Brussels City Museums accessible with Volume Pass.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {museums.map((museum) => (
                <div
                  key={museum.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group"
                >
                  {museum.pictures?.[0] ? (
                    <div className="w-full h-72 bg-gray-200 overflow-hidden relative">
                      <span className="absolute top-3 left-3 z-10 bg-white/90 text-xs font-semibold uppercase tracking-wider px-3 py-1 border border-gray-200">
                        culture
                      </span>
                      <img
                        src={museum.pictures[0]}
                        alt={museum.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-72 bg-gray-200 flex items-center justify-center relative">
                      <span className="absolute top-3 left-3 bg-white/90 text-xs font-semibold uppercase tracking-wider px-3 py-1 border border-gray-200">
                        culture
                      </span>
                      <span className="text-gray-400 text-sm uppercase tracking-wide">Photo</span>
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-extrabold text-gray-900">{museum.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{museum.address}</p>
                    {museum.description && (
                      <p className="text-sm text-gray-500 mt-2 leading-relaxed">{museum.description}</p>
                    )}
                    {museum.websiteUrl && (
                      <a
                        href={museum.websiteUrl.startsWith("http") ? museum.websiteUrl : `https://${museum.websiteUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-3 text-sm text-[#1a7fc7] hover:underline"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        {museum.websiteUrl.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
