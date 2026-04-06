import Link from "next/link";
import PricingCard from "@/components/PricingCard";
import OfferCard from "@/components/OfferCard";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const bulletPoints = [
  "Skip line exclusive access",
  "Official Tourism Office offer",
  "Use or refund at anytime",
  "7/7 Live Support Chat",
];

export default async function HomePage() {
  let clubs: Awaited<ReturnType<typeof db.club.findMany>> = [];
  let museums: Awaited<ReturnType<typeof db.museum.findMany>> = [];

  try {
    clubs = await db.club.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    museums = await db.museum.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  } catch {
    // DB not reachable during build
  }

  return (
    <>
      {/* Hero Section — matches original Softr site */}
      <section className="bg-[#1a7fc7] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 max-w-xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
              Brussels Nightlife in One Pass
            </h1>
            <p className="mt-6 text-lg leading-relaxed opacity-90">
              Enjoy 24h or 48h access to 9 nightclubs, the iconic Atomium, Brussels Design Museum, and 5 more museums.
            </p>
            <ul className="mt-6 space-y-2">
              {bulletPoints.map((point) => (
                <li key={point} className="flex items-center gap-3 text-sm font-medium">
                  <span className="text-white/80">&#8226;</span>
                  {point}
                </li>
              ))}
            </ul>
            <Link
              href="/buy-ticket"
              className="inline-block mt-8 bg-white text-[#1a7fc7] font-bold uppercase tracking-wide text-sm px-8 py-3.5 hover:bg-gray-100 transition-colors"
            >
              Buy Now
            </Link>
          </div>

          {/* Hero image — collage of club photos */}
          <div className="flex-1 w-full max-w-md lg:max-w-lg">
            {clubs.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 rounded-lg overflow-hidden">
                {clubs.slice(0, 4).map((club) => (
                  <div key={club.id} className="aspect-square bg-white/10">
                    {club.pictures?.[0] && (
                      <img
                        src={club.pictures[0]}
                        alt={club.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="aspect-[4/3] bg-white/10 rounded-lg" />
            )}
          </div>
        </div>
      </section>

      {/* Offers list — same as /offer page on original site */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold">With your Volume Pass</h2>
            <p className="mt-3 text-gray-500 text-lg font-medium">
              Offers included to enjoy an unforgettable weekend in Brussels!
            </p>
          </div>

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
        </div>
      </section>

      {/* Museums section */}
      {museums.length > 0 && (
        <section className="py-16 lg:py-20 bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-extrabold">Brussels City Museum Vouchers</h2>
              <p className="mt-3 text-gray-500 text-lg font-medium">
                Brussels City Museums accessible with Volume Pass.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {museums.map((museum) => (
                <div
                  key={museum.id}
                  className="bg-white border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300 group"
                >
                  {museum.pictures?.[0] ? (
                    <div className="w-full h-56 bg-gray-200 overflow-hidden relative">
                      <span className="absolute top-3 left-3 z-10 bg-white/90 text-xs font-semibold uppercase tracking-wider px-3 py-1 border border-gray-200">
                        culture
                      </span>
                      <img src={museum.pictures[0]} alt={museum.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  ) : (
                    <div className="w-full h-56 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-sm uppercase">Photo</span>
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="text-lg font-extrabold text-gray-900">{museum.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{museum.address}</p>
                    {museum.websiteUrl && (
                      <a href={museum.websiteUrl.startsWith("http") ? museum.websiteUrl : `https://${museum.websiteUrl}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-sm text-[#1a7fc7] hover:underline">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                        {museum.websiteUrl.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pricing Section — matches original screenshot exactly */}
      <section id="pricing" className="py-16 lg:py-20 bg-gray-50">
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
                "Free Access to 5 Brussels Museums",
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
                "Free Access to 5 Brussels Museums",
              ]}
              filled={true}
              passType="weekend"
            />
          </div>
        </div>
      </section>
    </>
  );
}
