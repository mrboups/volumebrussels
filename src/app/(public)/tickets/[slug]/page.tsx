import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import BuyTicketButton from "./BuyTicketButton";

export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function TicketSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const event = await db.event.findUnique({
    where: { slug },
    include: { pricingPhases: true, club: true },
  });

  if (!event || !event.isActive) {
    notFound();
  }

  const now = new Date();
  const activePhase = event.pricingPhases.find(
    (p) => new Date(p.startDate) <= now && new Date(p.endDate) >= now
  );

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Cover image */}
        {event.coverImage ? (
          <div className="w-full h-64 rounded-xl overflow-hidden bg-gray-200">
            <img
              src={event.coverImage}
              alt={event.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-64 rounded-xl bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400 text-sm uppercase tracking-wide">
              No Image
            </span>
          </div>
        )}

        {/* Event details */}
        <div className="mt-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold">{event.name}</h1>

          <div className="mt-4 space-y-1">
            <p className="text-gray-500 text-sm font-semibold uppercase tracking-wide">
              {formatDate(event.date)}
            </p>
            {(event.venueName || event.club?.name) && (
              <p className="text-gray-700 font-medium">
                {event.venueName || event.club?.name}
              </p>
            )}
            {(event.venueAddress || event.club?.address) && (
              <p className="text-gray-500 text-sm">
                {event.venueAddress || event.club?.address}
              </p>
            )}
          </div>

          {event.description && (
            <p className="mt-6 text-gray-600 leading-relaxed">
              {event.description}
            </p>
          )}
        </div>

        {/* Pricing / Buy */}
        <div className="mt-10 border-t pt-8">
          {activePhase ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 uppercase tracking-wide font-semibold">
                  {activePhase.name.replace("_", " ")}
                </p>
                <p className="text-3xl font-extrabold mt-1">
                  &euro;{activePhase.price.toFixed(2)}
                </p>
              </div>
              <BuyTicketButton
                eventId={event.id}
                pricingPhaseId={activePhase.id}
              />
            </div>
          ) : event.pricingPhases.length > 0 ? (
            <div className="text-center">
              <p className="text-gray-500">
                Ticket sales are not currently open for this event.
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Check back later for availability.
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-500">
                Tickets are not available online for this event.
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Contact us at{" "}
                <a
                  href="mailto:volumebrussels@gmail.com"
                  className="underline hover:text-black"
                >
                  volumebrussels@gmail.com
                </a>{" "}
                for more information.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
