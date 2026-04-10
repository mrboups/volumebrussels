import { db } from "@/lib/db";
import Link from "next/link";
import { getVisibilityCutoff } from "@/lib/tz";

export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Brussels",
  });
}

type EventWithPhases = Awaited<ReturnType<typeof db.event.findMany>>[number] & {
  pricingPhases: { id: string; name: string; price: number; startDate: Date; endDate: Date }[];
  club: { name: string } | null;
};

function EventCard({ event, muted = false }: { event: EventWithPhases; muted?: boolean }) {
  const now = new Date();
  const activePhase = event.pricingPhases.find(
    (p) => new Date(p.startDate) <= now && new Date(p.endDate) >= now
  );
  const lowestPrice = activePhase
    ? activePhase.price
    : event.pricingPhases.length > 0
      ? Math.min(...event.pricingPhases.map((p) => p.price))
      : null;

  return (
    <Link
      href={`/tickets/${event.slug}`}
      className={`bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow block ${
        muted ? "opacity-70 hover:opacity-100" : ""
      }`}
    >
      {event.coverImage ? (
        <div className={`relative w-full h-48 bg-gray-200 ${muted ? "grayscale" : ""}`}>
          <img
            src={event.coverImage}
            alt={event.name}
            className="w-full h-full object-cover"
          />
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
          {formatDate(event.date)}
        </p>
        <h3 className="text-lg font-extrabold mt-1">{event.name}</h3>
        {(event.venueName || event.club?.name) && (
          <p className="text-sm text-gray-500 mt-1">
            {event.venueName || event.club?.name}
          </p>
        )}
        {muted ? (
          <p className="text-xs font-semibold mt-2 text-gray-400 uppercase tracking-wide">
            Past event
          </p>
        ) : (
          lowestPrice !== null && (
            <p className="text-sm font-bold mt-2">From &euro;{lowestPrice.toFixed(2)}</p>
          )
        )}
      </div>
    </Link>
  );
}

export default async function TicketsIndexPage() {
  // Upcoming events remain visible until 02:00 Brussels the day AFTER their date.
  // Past the cutoff they move to a muted "Past Events" archive section below.
  const cutoff = getVisibilityCutoff();
  const allEvents = await db.event.findMany({
    where: { isActive: true },
    orderBy: { date: "asc" },
    include: { pricingPhases: true, club: true },
  });

  const upcoming = allEvents.filter((e) => e.date >= cutoff);
  const past = allEvents.filter((e) => e.date < cutoff).reverse();

  return (
    <section className="py-20 lg:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold">Tickets</h1>
          <p className="mt-4 text-gray-500 text-lg">
            Browse upcoming events and get your tickets.
          </p>
        </div>

        {upcoming.length === 0 && past.length === 0 ? (
          <p className="mt-16 text-center text-gray-400">
            No events with tickets available.
          </p>
        ) : (
          <>
            {upcoming.length > 0 ? (
              <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {upcoming.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <p className="mt-16 text-center text-gray-400">
                No upcoming events with tickets available.
              </p>
            )}

            {past.length > 0 && (
              <div className="mt-24">
                <div className="flex items-center gap-4 mb-8">
                  <h2 className="text-xl font-bold text-gray-500 uppercase tracking-wide">
                    Past Events
                  </h2>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {past.map((event) => (
                    <EventCard key={event.id} event={event} muted />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
