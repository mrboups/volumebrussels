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

function getEventImage(event: AgendaEvent): string {
  if (!event.media || !Array.isArray(event.media)) return "";
  const poster = event.media.find((m) => m.type === "poster");
  if (poster?.link) return poster.link;
  const photo = event.media.find((m) => m.type === "photo");
  return photo?.link || "";
}

async function getEvents(): Promise<AgendaEvent[]> {
  const res = await fetch(
    "https://api.agenda.be/event/search?volume_brussels=1&size=400",
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data || [])
    .filter((e: AgendaEvent) => e.date_start)
    .sort((a: AgendaEvent, b: AgendaEvent) => a.date_start.localeCompare(b.date_start));
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

export default async function AgendaPage() {
  const events = await getEvents();

  return (
    <section className="py-20 lg:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold">Agenda</h1>
          <p className="mt-4 text-gray-500 text-lg">
            Upcoming events across Brussels nightlife.
          </p>
        </div>

        {events.length === 0 ? (
          <p className="mt-16 text-center text-gray-400">No upcoming events.</p>
        ) : (
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => {
              const name =
                event.translations?.en?.name ||
                event.translations?.fr?.name ||
                event.translations?.nl?.name ||
                "Untitled";
              const venue = event.place?.translations?.en?.name || "";
              const image = getEventImage(event);

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
                    <h3 className="text-lg font-extrabold mt-1">{name}</h3>
                    {venue && (
                      <p className="text-sm text-gray-500 mt-1">{venue}</p>
                    )}
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
