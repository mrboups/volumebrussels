import MuseumForm from "../../_components/MuseumForm";
import { createMuseum } from "../../_actions";

export const dynamic = "force-dynamic";

export default function NewMuseumPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Add Museum</h1>
      <MuseumForm action={createMuseum} />
    </div>
  );
}
