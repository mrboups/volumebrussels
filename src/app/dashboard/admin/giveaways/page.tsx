import { db } from "@/lib/db";
import Link from "next/link";
import { deleteGiveawayForm, toggleGiveawayForm } from "../_actions";
import DeleteButton from "../_components/DeleteButton";
import ToggleForm from "./_components/ToggleForm";
import CopyLink from "./_components/CopyLink";

export const dynamic = "force-dynamic";

export default async function GiveawaysPage() {
  const forms = await db.giveawayForm.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { passes: true } } },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://volumebrussels.com";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Giveaway Forms</h1>
          <p className="text-sm text-gray-500 mt-1">
            Public forms where people can claim a free Night or Weekend pass.
          </p>
        </div>
        <Link
          href="/dashboard/admin/giveaways/new"
          className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
        >
          Add Form
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Pass Type</th>
              <th className="px-4 py-3 font-medium">Active</th>
              <th className="px-4 py-3 font-medium">Claimed</th>
              <th className="px-4 py-3 font-medium">Public Link</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {forms.map((f) => {
              const link = `${baseUrl}/giveaway/${f.slug}`;
              return (
                <tr key={f.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{f.titleEn}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{f.passType}</td>
                  <td className="px-4 py-3">
                    <ToggleForm
                      id={f.id}
                      isActive={f.isActive}
                      toggleAction={toggleGiveawayForm}
                    />
                  </td>
                  <td className="px-4 py-3 text-gray-600">{f._count.passes}</td>
                  <td className="px-4 py-3">
                    <CopyLink link={link} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/dashboard/admin/giveaways/${f.id}/edit`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Edit
                      </Link>
                      <DeleteButton action={deleteGiveawayForm.bind(null, f.id)} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {forms.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  No giveaway forms yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Link href="/dashboard/admin" className="inline-block text-sm text-gray-500 hover:text-black">
        &larr; Back to Admin
      </Link>
    </div>
  );
}
