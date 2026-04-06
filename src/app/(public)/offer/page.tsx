import OfferCard from "@/components/OfferCard";
import { db } from "@/lib/db";

export const revalidate = 60;

export default async function OfferPage() {
  const clubs = await db.club.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <section className="py-20 lg:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold">With your Volume Pass</h1>
          <p className="mt-4 text-gray-500 text-lg">
            Offers included to enjoy an unforgettable weekend in Brussels!
          </p>
        </div>

        {clubs.length === 0 ? (
          <p className="mt-16 text-center text-gray-400">No offers available at the moment.</p>
        ) : (
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
        )}
      </div>
    </section>
  );
}
