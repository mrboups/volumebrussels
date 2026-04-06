import Link from "next/link";
import PricingCard from "@/components/PricingCard";

const bulletPoints = [
  "Skip line exclusive access",
  "Official Tourism Office offer",
  "Use or refund at anytime",
  "7/7 Live Support Chat",
];

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="bg-[#1a7fc7] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 flex flex-col lg:flex-row items-center gap-12">
          {/* Left content */}
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

          {/* Right image placeholder */}
          <div className="flex-1 w-full max-w-md lg:max-w-lg">
            <div className="aspect-[4/3] bg-white/10 rounded-lg flex items-center justify-center">
              <span className="text-white/40 text-sm uppercase tracking-wide">Hero Image</span>
            </div>
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
            />
          </div>
        </div>
      </section>
    </>
  );
}
