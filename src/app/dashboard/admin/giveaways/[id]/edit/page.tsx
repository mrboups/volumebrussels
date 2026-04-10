import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import GiveawayFormEditor from "../../../_components/GiveawayFormEditor";
import { updateGiveawayForm } from "../../../_actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EditGiveawayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const form = await db.giveawayForm.findUnique({ where: { id } });
  if (!form) notFound();

  const boundAction = updateGiveawayForm.bind(null, id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Edit Giveaway Form</h1>
      <GiveawayFormEditor form={form} action={boundAction} />
      <Link
        href="/dashboard/admin/giveaways"
        className="inline-block text-sm text-gray-500 hover:text-black"
      >
        &larr; Back to list
      </Link>
    </div>
  );
}
