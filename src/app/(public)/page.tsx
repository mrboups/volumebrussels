import Link from "next/link";
import PricingCard from "@/components/PricingCard";
import OfferCard from "@/components/OfferCard";
import FAQ from "@/components/FAQ";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const bulletPoints = [
  "Skip line exclusive access",
  "Official Tourism Office offer",
  "Use or refund at anytime",
  "7/7 Live Support Chat",
];

const steps = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
      </svg>
    ),
    title: "Buy your pass",
    description: "Choose Night or Weekend pass online",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    title: "Show at the door",
    description: "Open the pass on your phone and show it to staff",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Enjoy Brussels",
    description: "Skip the line at 9 clubs + visit 7 museums",
  },
];

export default async function HomePage() {
  let clubs: Awaited<ReturnType<typeof db.club.findMany>> = [];
  let museums: Awaited<ReturnType<typeof db.museum.findMany>> = [];

  try {
    clubs = await db.club.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      take: 6,
    });
  } catch {
    // DB not reachable during build
  }

  try {
    museums = await db.museum.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  } catch {
    // DB not reachable during build
  }

  return (
    <>
      {/* Hero Section */}
      <section className="bg-[#1a7fc7] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 max-w-xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
              Brussels Nightlife in One Pass
            </h1>
            <p className="mt-6 text-lg leading-relaxed opacity-90">
              Enjoy 24h or 48h access to 9 nightclubs, the iconic Atomium, Brussels Design Museum, and 5 more museums.
            </p>
            <ul className="mt-8 space-y-3">
              {bulletPoints.map((point) => (
                <li key={point} className="flex items-center gap-3 text-sm font-medium">
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">&#10003;</span>
                  {point}
                </li>
              ))}
            </ul>
            <Link
              href="#pricing"
              className="inline-block mt-10 bg-white text-[#1a7fc7] font-bold uppercase tracking-wide text-sm px-8 py-3.5 hover:bg-gray-100 transition-colors"
            >
              Buy Now
            </Link>
          </div>

          <div className="flex-1 w-full max-w-md lg:max-w-lg">
            <div className="aspect-[4/3] bg-white/10 rounded-lg flex items-center justify-center">
              <span className="text-white/40 text-sm uppercase tracking-wide">Hero Image</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-center">How it works</h2>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-12">
            {steps.map((step, i) => (
              <div key={step.title} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-[#1a7fc7] text-white flex items-center justify-center">
                  {step.icon}
                </div>
                <span className="mt-4 text-xs font-bold uppercase tracking-widest text-gray-400">
                  Step {i + 1}
                </span>
                <h3 className="mt-2 text-xl font-extrabold">{step.title}</h3>
                <p className="mt-2 text-gray-500 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Clubs preview */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold">9 clubs, one pass</h2>
            <p className="mt-4 text-gray-500 text-lg">
              Skip the line and enjoy Brussels&apos; best nightlife venues
            </p>
          </div>

          {clubs.length > 0 ? (
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {clubs.map((club) => (
                <OfferCard
                  key={club.id}
                  name={club.name}
                  description={club.description || ""}
                  imageUrl={club.pictures?.[0]}
                  instagramUrl={club.instagramUrl || undefined}
                  facebookUrl={club.facebookUrl || undefined}
                />
              ))}
            </div>
          ) : (
            <p className="mt-16 text-center text-gray-400">Clubs loading...</p>
          )}

          <div className="mt-12 text-center">
            <Link
              href="/offer"
              className="inline-block border-2 border-black text-black font-semibold uppercase tracking-wide text-sm px-8 py-3 hover:bg-black hover:text-white transition-colors"
            >
              See all clubs
            </Link>
          </div>
        </div>
      </section>

      {/* Museums preview */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold">Museums included</h2>
            <p className="mt-4 text-gray-500 text-lg">
              Free access to Brussels&apos; finest museums
            </p>
          </div>

          {museums.length > 0 ? (
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {museums.map((museum) => (
                <div
                  key={museum.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {museum.pictures?.[0] ? (
                    <div className="w-full h-48 bg-gray-200">
                      <img
                        src={museum.pictures[0]}
                        alt={museum.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-sm uppercase tracking-wide">Photo</span>
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="text-lg font-extrabold uppercase">{museum.name}</h3>
                    <p className="text-gray-500 text-sm mt-1">{museum.address}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-16 text-center text-gray-400">Museums loading...</p>
          )}

          <div className="mt-12 text-center">
            <Link
              href="/museums"
              className="inline-block border-2 border-black text-black font-semibold uppercase tracking-wide text-sm px-8 py-3 hover:bg-black hover:text-white transition-colors"
            >
              Explore museums
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold">
              Your all-access pass to the city: choose your option
            </h2>
          </div>

          <div className="mt-16 flex flex-col sm:flex-row items-center sm:items-stretch justify-center gap-8">
            <PricingCard
              title="Night Pass"
              price="€29"
              subtitle="One night of clubbing"
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

      {/* FAQ Section */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-center">
            Frequently Asked Questions
          </h2>
          <div className="mt-12 max-w-3xl mx-auto">
            <FAQ />
          </div>
        </div>
      </section>
    </>
  );
}
