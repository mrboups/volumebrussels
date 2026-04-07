import ResellerForm from "../../_components/ResellerForm";
import { createReseller } from "../../_actions";

export const dynamic = "force-dynamic";

export default function NewResellerPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Add Reseller</h1>
      <ResellerForm action={createReseller} />
    </div>
  );
}
