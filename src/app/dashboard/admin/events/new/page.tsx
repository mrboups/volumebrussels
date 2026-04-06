import { db } from "@/lib/db";
import EventForm from "../../_components/EventForm";
import { createEvent } from "../../_actions";

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  const clubs = await db.club.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Add Event</h1>
      <EventForm clubs={clubs} action={createEvent} />
    </div>
  );
}
