"use client";

import { useState } from "react";
import Link from "next/link";
import PassActions from "./PassActions";

type SerializedPass = {
  id: string;
  createdAt: string;
  type: string;
  price: number;
  status: string;
  stripePaymentId: string | null;
  user: { email: string };
  _count: { scans: number };
};

const eur = new Intl.NumberFormat("fr-BE", {
  style: "currency",
  currency: "EUR",
});

function StatusBadge({ status }: { status: string }) {
  const colors =
    status === "active"
      ? "bg-green-50 text-green-700"
      : status === "expired"
      ? "bg-gray-100 text-gray-500"
      : status === "refunded"
      ? "bg-red-50 text-red-700"
      : "bg-blue-50 text-blue-700";
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${colors}`}>
      {status}
    </span>
  );
}

// Read the pass source (guest / giveaway) from the stripePaymentId marker.
// Paid passes use Stripe IDs (pi_…) and fall through to null.
function getPassSource(
  stripePaymentId: string | null
): { kind: "guest" } | { kind: "giveaway"; slug: string } | null {
  if (!stripePaymentId) return null;
  if (stripePaymentId.startsWith("guest_")) return { kind: "guest" };
  const m = stripePaymentId.match(/^giveaway_(.+)_\d+$/);
  if (m) return { kind: "giveaway", slug: m[1] };
  return null;
}

function SourceBadge({
  stripePaymentId,
  compact = false,
}: {
  stripePaymentId: string | null;
  compact?: boolean;
}) {
  const source = getPassSource(stripePaymentId);
  if (!source) return null;
  const base = `inline-block px-2 py-0.5 text-xs font-medium rounded ${
    compact ? "opacity-75" : ""
  }`;
  if (source.kind === "guest") {
    return (
      <span className={`${base} bg-amber-50 text-amber-700`}>guest</span>
    );
  }
  return (
    <span
      className={`${base} bg-pink-50 text-pink-700 max-w-[180px] truncate`}
      title={`giveaway: ${source.slug}`}
    >
      giveaway: {source.slug}
    </span>
  );
}

export default function PassGroup({ passes }: { passes: SerializedPass[] }) {
  const [expanded, setExpanded] = useState(false);

  if (passes.length === 1) {
    const pass = passes[0];
    return (
      <tr className="border-b border-gray-50 hover:bg-gray-50">
        <td className="px-4 py-3 text-gray-600">
          {new Date(pass.createdAt).toLocaleDateString("fr-BE")}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-block px-2 py-0.5 text-xs font-medium bg-purple-50 text-purple-700 rounded">
              {pass.type}
            </span>
            <SourceBadge stripePaymentId={pass.stripePaymentId} />
          </div>
        </td>
        <td className="px-4 py-3 text-gray-600">{eur.format(pass.price)}</td>
        <td className="px-4 py-3">
          <StatusBadge status={pass.status} />
        </td>
        <td className="px-4 py-3 text-gray-600">{pass.user.email}</td>
        <td className="px-4 py-3 text-gray-600">{pass._count.scans}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Link
              href={`/pass/${pass.id}`}
              target="_blank"
              className="text-blue-600 hover:text-blue-800 text-xs font-medium"
            >
              View
            </Link>
            <PassActions passId={pass.id} currentEmail={pass.user.email} />
          </div>
        </td>
      </tr>
    );
  }

  // Multiple passes in group
  const first = passes[0];
  const totalPrice = passes.reduce((sum, p) => sum + p.price, 0);
  const totalScans = passes.reduce((sum, p) => sum + p._count.scans, 0);
  const qty = passes.length;

  return (
    <>
      <tr
        className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-3 text-gray-600">
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`text-xs text-gray-400 transition-transform inline-block ${
                expanded ? "rotate-90" : ""
              }`}
            >
              &#9654;
            </span>
            {new Date(first.createdAt).toLocaleDateString("fr-BE")}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-block px-2 py-0.5 text-xs font-medium bg-purple-50 text-purple-700 rounded">
              {first.type}
            </span>
            <SourceBadge stripePaymentId={first.stripePaymentId} />
          </div>
        </td>
        <td className="px-4 py-3 text-gray-600">
          {eur.format(totalPrice)}
          <span className="ml-1.5 inline-block px-1.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded">
            x{qty}
          </span>
        </td>
        <td className="px-4 py-3">
          <StatusBadge status={first.status} />
        </td>
        <td className="px-4 py-3 text-gray-600">{first.user.email}</td>
        <td className="px-4 py-3 text-gray-600">{totalScans}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Link
              href={`/pass/${first.id}`}
              target="_blank"
              className="text-blue-600 hover:text-blue-800 text-xs font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              View
            </Link>
            <span onClick={(e) => e.stopPropagation()}>
              <PassActions passId={first.id} currentEmail={first.user.email} />
            </span>
          </div>
        </td>
      </tr>
      {expanded &&
        passes.map((pass) => (
          <tr
            key={pass.id}
            className="border-b border-gray-50 bg-gray-50/50"
          >
            <td className="pl-10 pr-4 py-2 text-gray-400 text-xs">
              {new Date(pass.createdAt).toLocaleDateString("fr-BE")}
            </td>
            <td className="px-4 py-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-block px-2 py-0.5 text-xs font-medium bg-purple-50/60 text-purple-600 rounded">
                  {pass.type}
                </span>
                <SourceBadge stripePaymentId={pass.stripePaymentId} compact />
              </div>
            </td>
            <td className="px-4 py-2 text-gray-400 text-xs">
              {eur.format(pass.price)}
            </td>
            <td className="px-4 py-2">
              <StatusBadge status={pass.status} />
            </td>
            <td className="px-4 py-2 text-gray-400 text-xs">
              {pass.user.email}
            </td>
            <td className="px-4 py-2 text-gray-400 text-xs">
              {pass._count.scans}
            </td>
            <td className="px-4 py-2">
              <Link
                href={`/pass/${pass.id}`}
                target="_blank"
                className="text-blue-600 hover:text-blue-800 text-xs font-medium"
              >
                View
              </Link>
            </td>
          </tr>
        ))}
    </>
  );
}
