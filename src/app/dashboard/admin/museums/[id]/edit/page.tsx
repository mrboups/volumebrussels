import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import MuseumForm from "../../../_components/MuseumForm";
import { updateMuseum } from "../../../_actions";

export const dynamic = "force-dynamic";

export default async function EditMuseumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const museum = await db.museum.findUnique({ where: { id } });
  if (!museum) notFound();

  const updateAction = updateMuseum.bind(null, museum.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Edit Museum: {museum.name}</h1>
      <MuseumForm museum={museum} action={updateAction} />
    </div>
  );
}
