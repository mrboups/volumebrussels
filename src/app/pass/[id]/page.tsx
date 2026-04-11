import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import PassClient from "./PassClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function PassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const pass = await db.pass.findUnique({
    where: { id },
    include: {
      scans: { include: { club: true, museum: true }, orderBy: { scannedAt: "asc" } },
    },
  });

  if (!pass) {
    notFound();
  }

  // Check and update expired status
  const now = new Date();
  if (pass.status === "active" && pass.expiresAt && now > pass.expiresAt) {
    await db.pass.update({
      where: { id },
      data: { status: "expired" },
    });
    pass.status = "expired";
  }

  // Get clubs based on pass inclusion rules
  const clubs = await db.club.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  // Filter clubs based on pass type and passInclusion
  const filteredClubs = clubs.filter((club) => {
    if (pass.type === "night") {
      // Night pass: show clubs that include the activation day or both
      return (
        club.passInclusion === "both" ||
        club.passInclusion === "friday" ||
        club.passInclusion === "saturday" ||
        club.passInclusion === "weekend"
      );
    }
    // Weekend pass: all clubs
    return true;
  });

  const museums = await db.museum.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  // Serialize dates for client component
  const serializedPass = {
    ...pass,
    createdAt: pass.createdAt.toISOString(),
    updatedAt: pass.updatedAt.toISOString(),
    activatedAt: pass.activatedAt?.toISOString() ?? null,
    expiresAt: pass.expiresAt?.toISOString() ?? null,
    scans: pass.scans.map((scan) => ({
      ...scan,
      scannedAt: scan.scannedAt.toISOString(),
      club: scan.club
        ? {
            ...scan.club,
            createdAt: scan.club.createdAt.toISOString(),
            updatedAt: scan.club.updatedAt.toISOString(),
          }
        : null,
      museum: scan.museum
        ? {
            ...scan.museum,
            createdAt: scan.museum.createdAt.toISOString(),
            updatedAt: scan.museum.updatedAt.toISOString(),
          }
        : null,
    })),
  };

  const serializedClubs = filteredClubs.map((club) => ({
    ...club,
    createdAt: club.createdAt.toISOString(),
    updatedAt: club.updatedAt.toISOString(),
  }));

  const serializedMuseums = museums.map((museum) => ({
    ...museum,
    createdAt: museum.createdAt.toISOString(),
    updatedAt: museum.updatedAt.toISOString(),
  }));

  // Sibling-pass assignment UI is only shown on the BUYER's pass. The
  // buyer's pass is the first one created inside a Stripe payment
  // group — all passes in a multi-quantity purchase are created in a
  // tight loop by the webhook with the same buyer userId. When the
  // buyer reassigns a sibling via /api/passes/assign, that sibling's
  // userId changes to the new recipient. We use that to filter out
  // already-assigned siblings so the "N passes to assign" header and
  // the per-pass buttons both stay in sync.
  let siblingPasses: { id: string; userId: string }[] = [];
  if (pass.stripePaymentId) {
    const allPasses = await db.pass.findMany({
      where: { stripePaymentId: pass.stripePaymentId },
      orderBy: { createdAt: "asc" },
      select: { id: true, userId: true },
    });
    const primary = allPasses[0];
    const isPrimary = primary && primary.id === pass.id;
    if (isPrimary) {
      // Only siblings that are still owned by the primary's userId are
      // unassigned. Anything else has already been given to someone.
      siblingPasses = allPasses
        .slice(1)
        .filter((p) => p.userId === primary.userId);
    }
    // Secondary passes (the ones already assigned away) get an empty
    // list, so the whole assign block is hidden on their view.
  }

  return (
    <PassClient
      pass={serializedPass}
      clubs={serializedClubs}
      museums={serializedMuseums}
      siblingPasses={siblingPasses}
    />
  );
}
