import { db } from "@/lib/db";
import Link from "next/link";
import { deleteReseller } from "../_actions";
import DeleteButton from "../_components/DeleteButton";
import MagicLinkButton from "../_components/MagicLinkButton";

export const dynamic = "force-dynamic";

export default async function ResellersPage() {
  const resellers = await db.reseller.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Resellers</h1>
        <Link
          href="/dashboard/admin/resellers/new"
          className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
        >
          Add Reseller
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Commission</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Magic Link</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {resellers.map((r) => (
              <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{r.user.name || "-"}</td>
                <td className="px-4 py-3 text-gray-600">{r.user.email}</td>
                <td className="px-4 py-3 text-gray-600">{(r.commissionRate * 100).toFixed(0)}%</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                      r.isActive
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {r.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <MagicLinkButton type="reseller" entityId={r.id} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/dashboard/admin/resellers/${r.id}/edit`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Edit
                    </Link>
                    <DeleteButton action={deleteReseller.bind(null, r.id)} />
                  </div>
                </td>
              </tr>
            ))}
            {resellers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  No resellers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Link
        href="/dashboard/admin"
        className="inline-block text-sm text-gray-500 hover:text-black"
      >
        &larr; Back to Admin
      </Link>
    </div>
  );
}
