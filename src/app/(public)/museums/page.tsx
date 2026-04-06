import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function MuseumsPage() {
  let museums: Awaited<ReturnType<typeof db.museum.findMany>> = [];

  try {
    museums = await db.museum.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  } catch {
    // DB not reachable during build
  }

  const featured = museums.filter(
    (m) => m.payPerVisit === 0 || m.payPerVisit === 8
  );
  const cityMuseums = museums.filter((m) => m.payPerVisit === 5);

  return (
    <>
      {/* Page header */}
      <section className="bg-[#1a7fc7] text-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold">
            Brussels City Museum Vouchers
          </h1>
          <p className="mt-4 text-lg opacity-90 max-w-2xl mx-auto">
            Museums accessible with your Volume Pass
          </p>
        </div>
      </section>

      {/* Featured Museums */}
      {featured.length > 0 && (
        <section className="py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold">Featured Museums</h2>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-8">
              {featured.map((museum) => (
                <MuseumCard key={museum.id} museum={museum} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Brussels City Museums */}
      {cityMuseums.length > 0 && (
        <section className="py-16 lg:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold">Brussels City Museums</h2>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {cityMuseums.map((museum) => (
                <MuseumCard key={museum.id} museum={museum} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty state */}
      {museums.length === 0 && (
        <section className="py-20 bg-white">
          <p className="text-center text-gray-400">No museums available at the moment.</p>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold">
            Get your Volume Pass today
          </h2>
          <p className="mt-4 text-gray-500 text-lg max-w-xl mx-auto">
            Access all museums and 9 nightclubs with a single pass
          </p>
          <Link
            href="/#pricing"
            className="inline-block mt-8 bg-black text-white font-semibold uppercase tracking-wide text-sm px-8 py-3.5 hover:bg-gray-900 transition-colors"
          >
            Buy Now
          </Link>
        </div>
      </section>
    </>
  );
}

interface MuseumCardProps {
  museum: {
    id: string;
    name: string;
    address: string;
    description: string | null;
    pictures: string[];
    websiteUrl: string | null;
  };
}

function MuseumCard({ museum }: MuseumCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      {museum.pictures?.[0] ? (
        <div className="w-full h-52 bg-gray-200">
          <img
            src={museum.pictures[0]}
            alt={museum.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-52 bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400 text-sm uppercase tracking-wide">Photo</span>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-center gap-2">
          <span className="inline-block bg-[#1a7fc7]/10 text-[#1a7fc7] text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded">
            culture
          </span>
        </div>
        <h3 className="mt-3 text-lg font-extrabold uppercase">{museum.name}</h3>
        <p className="text-gray-500 text-sm mt-1">{museum.address}</p>
        {museum.description && (
          <p className="text-gray-500 text-sm mt-2 leading-relaxed line-clamp-3">
            {museum.description}
          </p>
        )}
        {museum.websiteUrl && (
          <a
            href={museum.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 text-[#1a7fc7] text-sm font-semibold hover:underline"
          >
            Visit website
          </a>
        )}
      </div>
    </div>
  );
}
