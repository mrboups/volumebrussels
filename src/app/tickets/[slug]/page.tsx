import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import BuyTicketButton from "./BuyTicketButton";
import { getVisibilityCutoff } from "@/lib/tz";

export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Brussels",
  });
}

export default async function TicketSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // 1. Try finding an event by slug
  const event = await db.event.findUnique({
    where: { slug },
    include: { pricingPhases: true, club: true },
  });

  if (event && event.isActive) {
    return <SingleEventView event={event} />;
  }

  // 2. Fallback: find a club by slug and show all its events
  const club = await db.club.findUnique({ where: { slug } });
  if (club) {
    const clubEvents = await db.event.findMany({
      where: { clubId: club.id, isActive: true, date: { gte: getVisibilityCutoff() } },
      orderBy: { date: "asc" },
      include: { pricingPhases: true },
    });

    return <ClubEventsView club={club} events={clubEvents} />;
  }

  notFound();
}

function SingleEventView({ event }: { event: Awaited<ReturnType<typeof db.event.findUnique>> & { pricingPhases: { id: string; name: string; price: number; startDate: Date; endDate: Date }[]; club: { name: string; address: string } | null } }) {
  const now = new Date();
  const activePhase = event!.pricingPhases.find(
    (p) => new Date(p.startDate) <= now && new Date(p.endDate) >= now
  );
  const e = event!;
  const salesEnded = e.salesEnded;

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {e.coverImage ? (
          <div className="w-full h-64 rounded-xl overflow-hidden bg-gray-200">
            <img src={e.coverImage} alt={e.name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full h-64 rounded-xl bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400 text-sm uppercase tracking-wide">No Image</span>
          </div>
        )}

        <div className="mt-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold">{e.name}</h1>
          <div className="mt-4 space-y-1">
            <p className="text-gray-500 text-sm font-semibold uppercase tracking-wide">{formatDate(e.date)}</p>
            {(e.venueName || e.club?.name) && (
              <p className="text-gray-700 font-medium">{e.venueName || e.club?.name}</p>
            )}
            {(e.venueAddress || e.club?.address) && (
              <p className="text-gray-500 text-sm">{e.venueAddress || e.club?.address}</p>
            )}
          </div>
          {e.description && <p className="mt-6 text-gray-600 leading-relaxed">{e.description}</p>}
        </div>

        <div className="mt-10 border-t pt-8">
          {salesEnded ? (
            <div className="flex items-center justify-between">
              {activePhase && (
                <div>
                  <p className="text-sm text-gray-400 uppercase tracking-wide font-semibold">{activePhase.name.replace("_", " ")}</p>
                  <p className="text-3xl font-extrabold mt-1">&euro;{activePhase.price.toFixed(2)}</p>
                </div>
              )}
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Sales Ended
              </span>
            </div>
          ) : activePhase ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 uppercase tracking-wide font-semibold">{activePhase.name.replace("_", " ")}</p>
                <p className="text-3xl font-extrabold mt-1">&euro;{activePhase.price.toFixed(2)}</p>
              </div>
              <BuyTicketButton eventId={e.id} pricingPhaseId={activePhase.id} />
            </div>
          ) : e.pricingPhases.length > 0 ? (
            <p className="text-center text-gray-500">Ticket sales are not currently open for this event.</p>
          ) : (
            <p className="text-center text-gray-500">
              Tickets are not available online. Contact us at{" "}
              <a href="mailto:volumebrussels@gmail.com" className="underline hover:text-black">volumebrussels@gmail.com</a>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function ClubEventsView({ club, events }: { club: { name: string; slug: string; address: string; pictures: string[] }; events: (Awaited<ReturnType<typeof db.event.findFirst>> & { pricingPhases: { id: string; name: string; price: number; startDate: Date; endDate: Date }[] })[] }) {
  const now = new Date();

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-4 mb-8">
          {club.pictures?.[0] && (
            <img src={club.pictures[0]} alt={club.name} className="w-16 h-16 rounded-full object-cover" />
          )}
          <div>
            <h1 className="text-3xl font-extrabold">{club.name}</h1>
            <p className="text-gray-500 text-sm">{club.address}</p>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-6">Upcoming Events</h2>

        {events.length === 0 ? (
          <p className="text-gray-400 text-center py-12">No upcoming events for this club.</p>
        ) : (
          <div className="space-y-6">
            {events.map((event) => {
              const activePhase = event!.pricingPhases.find(
                (p) => new Date(p.startDate) <= now && new Date(p.endDate) >= now
              );
              const e = event!;
              return (
                <div key={e.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="flex flex-col sm:flex-row">
                    {e.coverImage && (
                      <div className="sm:w-48 h-40 sm:h-auto bg-gray-200 flex-shrink-0">
                        <img src={e.coverImage} alt={e.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-5 flex-1">
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{formatDate(e.date)}</p>
                      <h3 className="text-lg font-bold mt-1">{e.name}</h3>
                      {e.description && <p className="text-gray-500 text-sm mt-2 line-clamp-2">{e.description}</p>}
                      <div className="mt-4 flex items-center justify-between">
                        {e.salesEnded ? (
                          <>
                            {activePhase && (
                              <p className="text-xl font-bold">&euro;{activePhase.price.toFixed(2)}</p>
                            )}
                            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                              Sales Ended
                            </span>
                          </>
                        ) : activePhase ? (
                          <>
                            <p className="text-xl font-bold">&euro;{activePhase.price.toFixed(2)}</p>
                            <BuyTicketButton eventId={e.id} pricingPhaseId={activePhase.id} />
                          </>
                        ) : (
                          <a href={`/tickets/${e.slug}`} className="text-sm text-[#1a7fc7] font-medium hover:underline">View details</a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
