import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Brussels",
  });
}

export default async function EventsLinksPage() {
  const events = await db.event.findMany({
    where: { isActive: true },
    orderBy: { date: "asc" },
    select: { id: true, name: true, slug: true, date: true },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://volumebrussels.com";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Event Sale Links</h1>
      <p className="text-sm text-gray-500">Internal list of all active events and their public sale links.</p>

      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Event Name</th>
              <th className="px-4 py-3 font-medium">Sale Link</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => {
              const link = `${baseUrl}/tickets/${event.slug}`;
              return (
                <tr key={event.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(event.date)}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{event.name}</td>
                  <td className="px-4 py-3">
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all text-xs"
                    >
                      {link}
                    </a>
                  </td>
                </tr>
              );
            })}
            {events.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                  No active events.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
