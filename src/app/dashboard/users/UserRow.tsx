"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { undoTicketValidation } from "../admin/_actions";

const eur = new Intl.NumberFormat("fr-BE", {
  style: "currency",
  currency: "EUR",
});

type SerializedPass = {
  id: string;
  type: string;
  price: number;
  status: string;
  stripePaymentId: string | null;
  createdAt: string;
  scanCount: number;
};

type SerializedTicket = {
  id: string;
  eventName: string;
  clubName: string | null;
  eventDate: string;
  pricePaid: number;
  status: string;
  validatedAt: string | null;
  createdAt: string;
};

export type SerializedUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  passes: SerializedPass[];
  tickets: SerializedTicket[];
};

function getPassSource(
  stripePaymentId: string | null
): { kind: "guest" } | { kind: "giveaway"; slug: string } | null {
  if (!stripePaymentId) return null;
  if (stripePaymentId.startsWith("guest_")) return { kind: "guest" };
  const m = stripePaymentId.match(/^giveaway_(.+)_\d+$/);
  if (m) return { kind: "giveaway", slug: m[1] };
  return null;
}

function RoleBadge({ role }: { role: string }) {
  const colors =
    role === "admin"
      ? "bg-red-50 text-red-700"
      : role === "club"
      ? "bg-blue-50 text-blue-700"
      : role === "reseller"
      ? "bg-amber-50 text-amber-700"
      : "bg-gray-100 text-gray-600";
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${colors}`}
    >
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors =
    status === "active" || status === "used"
      ? "bg-green-50 text-green-700"
      : status === "expired"
      ? "bg-gray-100 text-gray-500"
      : status === "refunded"
      ? "bg-red-50 text-red-700"
      : "bg-blue-50 text-blue-700";
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${colors}`}
    >
      {status}
    </span>
  );
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("fr-BE");
}

function InlineUndoTicket({ ticketId }: { ticketId: string }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await undoTicketValidation(ticketId);
      if (res?.error) {
        setError(res.error);
        setConfirming(false);
      }
    });
  }

  if (error) return <span className="text-red-600" title={error}>err</span>;

  if (confirming) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="text-red-700 font-semibold hover:text-red-900 disabled:opacity-50"
      >
        {pending ? "…" : "Confirm"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-red-600 font-medium hover:text-red-800"
      title="Undo check-in"
    >
      Undo
    </button>
  );
}

export default function UserRow({ user }: { user: SerializedUser }) {
  const [expanded, setExpanded] = useState(false);

  const totalSpent =
    user.passes.reduce((s, p) => s + p.price, 0) +
    user.tickets.reduce((s, t) => s + t.pricePaid, 0);

  return (
    <>
      <tr
        className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-3 text-gray-400">
          <span
            className={`text-xs transition-transform inline-block ${
              expanded ? "rotate-90" : ""
            }`}
          >
            &#9654;
          </span>
        </td>
        <td className="px-4 py-3 font-medium text-gray-900">{user.email}</td>
        <td className="px-4 py-3 text-gray-600">
          {user.name || <span className="text-gray-400">—</span>}
        </td>
        <td className="px-4 py-3">
          <RoleBadge role={user.role} />
        </td>
        <td className="px-4 py-3 text-gray-600">{user.passes.length}</td>
        <td className="px-4 py-3 text-gray-600">{user.tickets.length}</td>
        <td className="px-4 py-3 text-gray-500 text-xs">
          {formatDateShort(user.createdAt)}
        </td>
      </tr>

      {expanded && (
        <tr className="bg-gray-50/50">
          <td colSpan={7} className="px-6 py-5">
            <div className="space-y-6">
              {/* User meta */}
              <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs text-gray-500">
                <div>
                  <span className="uppercase tracking-wide font-semibold text-gray-400">
                    ID
                  </span>{" "}
                  <span className="font-mono">{user.id}</span>
                </div>
                <div>
                  <span className="uppercase tracking-wide font-semibold text-gray-400">
                    Total spent
                  </span>{" "}
                  <span className="text-gray-900 font-semibold">
                    {eur.format(totalSpent)}
                  </span>
                </div>
              </div>

              {/* Passes */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                  Passes ({user.passes.length})
                </h4>
                {user.passes.length === 0 ? (
                  <p className="text-xs text-gray-400">No passes.</p>
                ) : (
                  <div className="bg-white rounded-md border border-gray-200 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 text-left text-gray-500">
                          <th className="px-3 py-2 font-medium">Date</th>
                          <th className="px-3 py-2 font-medium">Type</th>
                          <th className="px-3 py-2 font-medium">Price</th>
                          <th className="px-3 py-2 font-medium">Status</th>
                          <th className="px-3 py-2 font-medium">Scans</th>
                          <th className="px-3 py-2 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {user.passes.map((p) => {
                          const source = getPassSource(p.stripePaymentId);
                          return (
                            <tr
                              key={p.id}
                              className="border-b border-gray-50 last:border-b-0"
                            >
                              <td className="px-3 py-2 text-gray-600">
                                {formatDateShort(p.createdAt)}
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="inline-block px-2 py-0.5 font-medium bg-purple-50 text-purple-700 rounded">
                                    {p.type}
                                  </span>
                                  {source?.kind === "guest" && (
                                    <span className="inline-block px-2 py-0.5 font-medium bg-amber-50 text-amber-700 rounded">
                                      guest
                                    </span>
                                  )}
                                  {source?.kind === "giveaway" && (
                                    <span
                                      className="inline-block px-2 py-0.5 font-medium bg-pink-50 text-pink-700 rounded max-w-[160px] truncate"
                                      title={`giveaway: ${source.slug}`}
                                    >
                                      giveaway: {source.slug}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-gray-600">
                                {eur.format(p.price)}
                              </td>
                              <td className="px-3 py-2">
                                <StatusBadge status={p.status} />
                              </td>
                              <td className="px-3 py-2 text-gray-600">
                                {p.scanCount}
                              </td>
                              <td className="px-3 py-2">
                                <Link
                                  href={`/pass/${p.id}`}
                                  target="_blank"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  View
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Tickets */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                  Tickets ({user.tickets.length})
                </h4>
                {user.tickets.length === 0 ? (
                  <p className="text-xs text-gray-400">No tickets.</p>
                ) : (
                  <div className="bg-white rounded-md border border-gray-200 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 text-left text-gray-500">
                          <th className="px-3 py-2 font-medium">Purchased</th>
                          <th className="px-3 py-2 font-medium">Event</th>
                          <th className="px-3 py-2 font-medium">Event Date</th>
                          <th className="px-3 py-2 font-medium">Price</th>
                          <th className="px-3 py-2 font-medium">Status</th>
                          <th className="px-3 py-2 font-medium">Validated</th>
                          <th className="px-3 py-2 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {user.tickets.map((t) => (
                          <tr
                            key={t.id}
                            className="border-b border-gray-50 last:border-b-0"
                          >
                            <td className="px-3 py-2 text-gray-600">
                              {formatDateShort(t.createdAt)}
                            </td>
                            <td className="px-3 py-2 font-medium text-gray-900">
                              {t.eventName}
                              {t.clubName && (
                                <span className="text-gray-400 font-normal">
                                  {" "}
                                  · {t.clubName}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              {t.eventDate}
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              {eur.format(t.pricePaid)}
                            </td>
                            <td className="px-3 py-2">
                              <StatusBadge status={t.status} />
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              {t.validatedAt ? (
                                <span className="text-green-700">
                                  {formatDateShort(t.validatedAt)}
                                </span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/ticket/${t.id}`}
                                  target="_blank"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  View
                                </Link>
                                {t.validatedAt && (
                                  <InlineUndoTicket ticketId={t.id} />
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
