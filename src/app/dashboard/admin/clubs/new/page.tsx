import ClubForm from "../../_components/ClubForm";
import { createClub } from "../../_actions";

export const dynamic = "force-dynamic";

export default function NewClubPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Add Club</h1>
      <ClubForm action={createClub} />
    </div>
  );
}
