"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import SwipeSlider from "@/components/SwipeSlider";

interface Club {
  id: string;
  name: string;
  slug: string;
  address: string;
  description: string | null;
  pictures: string[];
  instagramUrl: string | null;
  facebookUrl: string | null;
  payPerVisit: number;
  openDays: string[];
  passInclusion: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Museum {
  id: string;
  name: string;
  slug: string;
  address: string;
  description: string | null;
  pictures: string[];
  websiteUrl: string | null;
  payPerVisit: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Scan {
  id: string;
  passId: string;
  clubId: string | null;
  museumId: string | null;
  scannedAt: string;
  scannedBy: string | null;
  club: Club | null;
  museum: Museum | null;
}

interface Pass {
  id: string;
  type: string;
  price: number;
  userId: string;
  status: string;
  activatedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  scans: Scan[];
}

interface SiblingPass {
  id: string;
  userId: string;
}

interface PassClientProps {
  pass: Pass;
  clubs: Club[];
  museums: Museum[];
  siblingPasses?: SiblingPass[];
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    purchased: "bg-neutral-200 text-neutral-700",
    active: "bg-green-600 text-white",
    expired: "bg-red-600 text-white",
    refunded: "bg-neutral-400 text-white",
  };

  return (
    <span
      className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-sm ${
        styles[status] || "bg-neutral-200 text-neutral-700"
      }`}
    >
      {status}
    </span>
  );
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString("en-GB", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatTimestamp(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getClubImage(club: Club): string {
  if (club.pictures.length > 0) return club.pictures[0];
  if (club.slug === "umi") return `/clubs/${club.slug}.png`;
  return `/clubs/${club.slug}.jpg`;
}

function getMuseumImage(museum: Museum): string {
  if (museum.pictures.length > 0) return museum.pictures[0];
  return `/museums/${museum.slug}.jpg`;
}

export default function PassClient({
  pass: initialPass,
  clubs,
  museums,
  siblingPasses = [],
}: PassClientProps) {
  const [pass, setPass] = useState<Pass>(initialPass);
  const [error, setError] = useState<string | null>(null);
  const [assignEmail, setAssignEmail] = useState("");
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const [assignError, setAssignError] = useState<string | null>(null);

  const clubScans = pass.scans.filter((s) => s.clubId !== null);
  const museumScans = pass.scans.filter((s) => s.museumId !== null);
  const maxClubs = pass.type === "night" ? 2 : null;
  const clubsRemaining = maxClubs !== null ? maxClubs - clubScans.length : null;

  const isClubCheckedIn = useCallback(
    (clubId: string) => clubScans.some((s) => s.clubId === clubId),
    [clubScans]
  );

  const isMuseumCheckedIn = useCallback(
    (museumId: string) => museumScans.some((s) => s.museumId === museumId),
    [museumScans]
  );

  const getClubScan = useCallback(
    (clubId: string) => clubScans.find((s) => s.clubId === clubId),
    [clubScans]
  );

  const getMuseumScan = useCallback(
    (museumId: string) => museumScans.find((s) => s.museumId === museumId),
    [museumScans]
  );

  const canCheckInClub =
    pass.status === "purchased" || pass.status === "active";
  const canCheckInMuseum = pass.status === "active";

  const museumAccessExpired = (() => {
    if (!pass.activatedAt) return false;
    const deadline = new Date(pass.activatedAt);
    deadline.setDate(deadline.getDate() + 7);
    return new Date() > deadline;
  })();

  const handleClubScan = useCallback(
    async (clubId: string) => {
      setError(null);
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passId: pass.id, clubId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to check in");
        throw new Error(data.error);
      }

      // Update local pass state with the response
      setPass((prev) => ({
        ...prev,
        status: data.pass.status,
        activatedAt: data.pass.activatedAt,
        expiresAt: data.pass.expiresAt,
        scans: [
          ...prev.scans,
          {
            ...data.scan,
            club:
              clubs.find((c) => c.id === clubId) !== undefined
                ? { ...(clubs.find((c) => c.id === clubId) as Club) }
                : null,
            museum: null,
          },
        ],
      }));
    },
    [pass.id, clubs]
  );

  const handleMuseumScan = useCallback(
    async (museumId: string) => {
      setError(null);
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passId: pass.id, museumId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to check in");
        throw new Error(data.error);
      }

      setPass((prev) => ({
        ...prev,
        status: data.pass.status,
        activatedAt: data.pass.activatedAt,
        expiresAt: data.pass.expiresAt,
        scans: [
          ...prev.scans,
          {
            ...data.scan,
            club: null,
            museum:
              museums.find((m) => m.id === museumId) !== undefined
                ? { ...(museums.find((m) => m.id === museumId) as Museum) }
                : null,
          },
        ],
      }));
    },
    [pass.id, museums]
  );

  // Sort: unchecked venues first, checked-in ones at the bottom
  const sortedClubs = [...clubs].sort((a, b) => {
    const aChecked = isClubCheckedIn(a.id);
    const bChecked = isClubCheckedIn(b.id);
    if (aChecked && !bChecked) return 1;
    if (!aChecked && bChecked) return -1;
    return 0;
  });

  const sortedMuseums = [...museums].sort((a, b) => {
    const aChecked = isMuseumCheckedIn(a.id);
    const bChecked = isMuseumCheckedIn(b.id);
    if (aChecked && !bChecked) return 1;
    if (!aChecked && bChecked) return -1;
    return 0;
  });

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-lg mx-auto px-4 py-0">
        {/* Header with pass info */}
        <div className="-mx-4 px-5 py-6 bg-neutral-900">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold uppercase tracking-wide">
              {pass.type === "night" ? "Night Pass" : "Weekend Pass"}
            </span>
            <StatusBadge status={pass.status} />
          </div>

          {pass.status === "active" && pass.activatedAt && (
            <p className="text-white/60 text-xs mb-1">
              Activated {formatTimestamp(pass.activatedAt)}
            </p>
          )}

          {pass.status === "active" && pass.expiresAt && (
            <p className="text-green-300 text-sm font-semibold">
              Valid until {formatTime(pass.expiresAt)}
            </p>
          )}

          {pass.status === "purchased" && (
            <p className="text-white/70 text-sm">
              Not yet activated. Check in at a club to activate.
            </p>
          )}

          {pass.status === "expired" && (
            <p className="text-red-300 text-sm">This pass has expired.</p>
          )}

          {pass.status === "refunded" && (
            <p className="text-white/60 text-sm">
              This pass has been refunded.
            </p>
          )}

          {clubsRemaining !== null && (
            <p className="text-white/50 text-xs mt-2 uppercase tracking-wide">
              {clubsRemaining} club{clubsRemaining !== 1 ? "s" : ""} remaining
            </p>
          )}
        </div>

        {/* Assign additional passes — right below header */}
        {siblingPasses.length > 0 && (
          <div className="bg-neutral-800 text-white -mx-4 px-5 py-4 border-t border-neutral-700">
            <p className="text-sm font-bold uppercase tracking-wide mb-3">
              {siblingPasses.length} additional pass{siblingPasses.length > 1 ? "es" : ""} to assign
            </p>
            {siblingPasses.map((sp, i) => (
              <div key={sp.id} className="flex items-center gap-2 mt-2">
                {assignedIds.has(sp.id) ? (
                  <p className="text-green-400 text-sm font-semibold">Pass #{i + 2} sent!</p>
                ) : assigningId === sp.id ? (
                  <>
                    <input
                      type="email"
                      placeholder="Enter email address"
                      value={assignEmail}
                      onChange={(e) => setAssignEmail(e.target.value)}
                      className="flex-1 bg-neutral-900 border border-neutral-600 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-neutral-400 focus:outline-none"
                    />
                    <button
                      onClick={async () => {
                        setAssignError(null);
                        const res = await fetch("/api/passes/assign", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ passId: sp.id, email: assignEmail }),
                        });
                        if (res.ok) {
                          setAssignedIds((prev) => new Set([...prev, sp.id]));
                          setAssigningId(null);
                          setAssignEmail("");
                        } else {
                          const d = await res.json().catch(() => ({}));
                          setAssignError(d.error || "Failed");
                        }
                      }}
                      className="bg-white text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-neutral-200 cursor-pointer"
                    >
                      Send
                    </button>
                    <button onClick={() => { setAssigningId(null); setAssignEmail(""); }} className="text-neutral-500 text-sm cursor-pointer">Cancel</button>
                  </>
                ) : (
                  <button
                    onClick={() => setAssigningId(sp.id)}
                    className="bg-[#1a7fc7] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#1565a0] cursor-pointer"
                  >
                    Assign pass #{i + 2}
                  </button>
                )}
              </div>
            ))}
            {assignError && <p className="text-red-400 text-sm mt-2">{assignError}</p>}
          </div>
        )}

        {/* Warning */}
        <div className="bg-yellow-900/30 border border-yellow-700/50 px-4 py-3 mb-6 mt-4">
          <p className="text-yellow-400 text-xs font-bold uppercase tracking-wide text-center">
            Show this ticket at the entrance of the club to check in.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-700/50 px-4 py-3 mb-4">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Clubs Section */}
        <div className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-4">
            Clubs
          </h2>

          <div className="flex flex-col gap-4">
            {sortedClubs.map((club) => {
              const checkedIn = isClubCheckedIn(club.id);
              const scan = getClubScan(club.id);
              const atMaxClubs =
                maxClubs !== null && clubScans.length >= maxClubs;
              const disabled =
                !canCheckInClub || (atMaxClubs && !checkedIn);

              return (
                <div key={club.id} className="bg-neutral-900 overflow-hidden">
                  {/* Club image */}
                  <div className="relative w-full h-40">
                    <Image
                      src={getClubImage(club)}
                      alt={club.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 512px) 100vw, 512px"
                    />
                    {checkedIn && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <svg
                          className="w-12 h-12 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Club info */}
                  <div className="p-4">
                    <h3 className="text-base font-bold uppercase tracking-wide">
                      {club.name}
                    </h3>
                    <p className="text-neutral-500 text-xs mt-1">
                      {club.address}
                    </p>

                    {/* Check-in area */}
                    <div className="mt-3">
                      {checkedIn && scan ? (
                        <div className="flex items-center gap-2 py-2">
                          <svg
                            className="w-5 h-5 text-green-500 shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="text-green-500 text-xs font-semibold">
                            Checked in {formatTimestamp(scan.scannedAt)}
                          </span>
                        </div>
                      ) : (
                        <SwipeSlider
                          onComplete={() => handleClubScan(club.id)}
                          label="Swipe to check in"
                          completedLabel="Checked in"
                          disabled={disabled}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Museums Section — light mode */}
        <div className="mb-8 bg-gray-50 -mx-4 px-4 py-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-600 mb-2">
            Museums
          </h2>
          <p className="text-gray-500 text-xs mb-4">
            Museums do not activate your pass. Accessible for 1 week after
            activation.
          </p>

          {!canCheckInMuseum && pass.status === "purchased" && (
            <div className="bg-gray-200 px-4 py-3 mb-4 rounded">
              <p className="text-gray-500 text-xs text-center">
                Activate your pass at a club first to access museums.
              </p>
            </div>
          )}

          {museumAccessExpired && (
            <div className="bg-red-50 px-4 py-3 mb-4 rounded">
              <p className="text-red-500 text-xs text-center">
                Museum access window has expired (1 week from activation).
              </p>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {sortedMuseums.map((museum) => {
              const checkedIn = isMuseumCheckedIn(museum.id);
              const scan = getMuseumScan(museum.id);
              const disabled = !canCheckInMuseum || museumAccessExpired;

              return (
                <div
                  key={museum.id}
                  className="bg-white overflow-hidden rounded-lg border border-gray-200"
                >
                  <div className="relative w-full h-32">
                    <Image
                      src={getMuseumImage(museum)}
                      alt={museum.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 512px) 100vw, 512px"
                    />
                    {checkedIn && (
                      <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                        <svg
                          className="w-10 h-10 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="text-base font-bold uppercase tracking-wide text-gray-900">
                      {museum.name}
                    </h3>
                    <p className="text-gray-500 text-xs mt-1">
                      {museum.address}
                    </p>

                    <div className="mt-3">
                      {checkedIn && scan ? (
                        <div className="flex items-center gap-2 py-2">
                          <svg
                            className="w-5 h-5 text-green-500 shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="text-green-500 text-xs font-semibold">
                            Validated {formatTimestamp(scan.scannedAt)}
                          </span>
                        </div>
                      ) : (
                        <SwipeSlider
                          onComplete={() => handleMuseumScan(museum.id)}
                          label="Swipe to check in"
                          completedLabel="Checked in"
                          disabled={disabled || checkedIn}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
