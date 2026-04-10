import GiveawayFormEditor from "../../_components/GiveawayFormEditor";
import { createGiveawayForm } from "../../_actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NewGiveawayPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">New Giveaway Form</h1>
      <GiveawayFormEditor action={createGiveawayForm} />
      <Link
        href="/dashboard/admin/giveaways"
        className="inline-block text-sm text-gray-500 hover:text-black"
      >
        &larr; Back to list
      </Link>
    </div>
  );
}
