import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import UndoScanButton from "../../_components/UndoScanButton";
import RefundButton from "../../_components/RefundButton";
import { formatBrusselsFull } from "@/lib/tz";

export const dynamic = "force-dynamic";

const eur = new Intl.NumberFormat("fr-BE", {
  style: "currency",
  currency: "EUR",
});

function getPassSource(
  stripePaymentId: string | null
): { kind: "stripe" } | { kind: "guest" } | { kind: "giveaway"; slug: string } | { kind: "legacy" } | null {
  if (!stripePaymentId) return null;
  if (stripePaymentId.startsWith("pi_")) return { kind: "stripe" };
  if (stripePaymentId.startsWith("guest_")) return { kind: "guest" };
  if (stripePaymentId.startsWith("legacy_migration_")) return { kind: "legacy" };
  const m = stripePaymentId.match(/^giveaway_(.+)_\d+$/);
  if (m) return { kind: "giveaway", slug: m[1] };
  return null;
}

function StatusBadge({ status }: { status: string }) {
  const colors =
    status === "active"
      ? "bg-green-50 text-green-700 border-green-200"
      : status === "expired"
      ? "bg-gray-100 text-gray-500 border-gray-200"
      : status === "refunded"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-blue-50 text-blue-700 border-blue-200";
  return (
    <span
      className={`inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wide rounded border ${colors}`}
    >
      {status}
    </span>
  );
}

export default async function PassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const pass = await db.pass.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, name: true } },
      form: { select: { slug: true, titleEn: true } },
      scans: {
        include: {
          club: { select: { name: true } },
          museum: { select: { name: true } },
        },
        orderBy: { scannedAt: "desc" },
      },
    },
  });

  if (!pass) notFound();

  const source = getPassSource(pass.stripePaymentId);
  const isStripeBacked = source?.kind === "stripe";
  const canRefund = pass.status !== "refunded";

  // Sibling passes from the same purchase
  const siblingCount = pass.stripePaymentId
    ? await db.pass.count({
        where: {
          stripePaymentId: pass.stripePaymentId,
          id: { not: pass.id },
        },
      })
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/passes"
          className="text-sm text-gray-500 hover:text-black"
        >
          &larr; Back to passes
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
              Pass
            </p>
            <h1 className="text-2xl font-bold text-gray-900 mt-1 capitalize">
              {pass.type} Pass
            </h1>
            <p className="text-sm text-gray-500 mt-1 font-mono">{pass.id}</p>
          </div>

          {canRefund && (
            <RefundButton
              target="pass"
              id={pass.id}
              amount={pass.price}
              isStripeBacked={isStripeBacked}
            />
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 mt-6 pt-6 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
              Customer
            </p>
            <p className="text-sm text-gray-900 mt-1">{pass.user.email}</p>
            {pass.user.name && (
              <p className="text-xs text-gray-500">{pass.user.name}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
              Status
            </p>
            <div className="mt-1">
              <StatusBadge status={pass.status} />
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
              Price
            </p>
            <p className="text-sm text-gray-900 mt-1 font-semibold">
              {eur.format(pass.price)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
              Created
            </p>
            <p className="text-sm text-gray-900 mt-1">
              {formatBrusselsFull(pass.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
              Activated
            </p>
            <p className="text-sm text-gray-900 mt-1">
              {pass.activatedAt ? (
                formatBrusselsFull(pass.activatedAt)
              ) : (
                <span className="text-gray-400">Not yet activated</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
              Expires
            </p>
            <p className="text-sm text-gray-900 mt-1">
              {pass.expiresAt ? (
                formatBrusselsFull(pass.expiresAt)
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </p>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
              Source
            </p>
            <p className="text-sm text-gray-900 mt-1">
              {source?.kind === "stripe" && (
                <>
                  Stripe payment{" "}
                  <span className="font-mono text-xs">
                    {pass.stripePaymentId}
                  </span>
                  {siblingCount > 0 && (
                    <span className="text-gray-500">
                      {" "}
                      (part of a {siblingCount + 1}-pass purchase)
                    </span>
                  )}
                </>
              )}
              {source?.kind === "guest" && (
                <span className="inline-block px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 rounded">
                  guest pass — admin issued
                </span>
              )}
              {source?.kind === "giveaway" && (
                <span className="inline-block px-2 py-0.5 text-xs font-medium bg-pink-50 text-pink-700 rounded">
                  giveaway: {pass.form?.titleEn ?? source.slug}
                </span>
              )}
              {source?.kind === "legacy" && (
                <span className="inline-block px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                  legacy migration
                </span>
              )}
              {!source && (
                <span className="text-gray-400">
                  {pass.stripePaymentId ?? "unknown"}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <Link
            href={`/pass/${pass.id}`}
            target="_blank"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Open customer pass view →
          </Link>
        </div>
      </div>

      {/* Scan history */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Scan History ({pass.scans.length})
        </h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Venue</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pass.scans.map((scan) => (
                <tr
                  key={scan.id}
                  className="border-b border-gray-50 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-gray-600">
                    {formatBrusselsFull(scan.scannedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                        scan.clubId
                          ? "bg-purple-50 text-purple-700"
                          : "bg-teal-50 text-teal-700"
                      }`}
                    >
                      {scan.clubId ? "club" : "museum"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {scan.club?.name ?? scan.museum?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <UndoScanButton scanId={scan.id} />
                  </td>
                </tr>
              ))}
              {pass.scans.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    No scans yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
