import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import ClubForm from "../../../_components/ClubForm";
import { updateClub } from "../../../_actions";

export const dynamic = "force-dynamic";

export default async function EditClubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const club = await db.club.findUnique({ where: { id } });
  if (!club) notFound();

  const updateAction = updateClub.bind(null, club.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Edit Club: {club.name}</h1>
      <ClubForm club={club} action={updateAction} />
    </div>
  );
}
