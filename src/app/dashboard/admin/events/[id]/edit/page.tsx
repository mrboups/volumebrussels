import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import EventForm from "../../../_components/EventForm";
import { updateEvent } from "../../../_actions";

export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, clubs] = await Promise.all([
    db.event.findUnique({
      where: { id },
      include: { pricingPhases: true },
    }),
    db.club.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!event) notFound();

  const updateAction = updateEvent.bind(null, event.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Edit Event: {event.name}</h1>
      <EventForm event={event} clubs={clubs} action={updateAction} />
    </div>
  );
}
