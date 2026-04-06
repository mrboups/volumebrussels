import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import PassClient from "./PassClient";

export const dynamic = "force-dynamic";

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
    orderBy: { name: "asc" },
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
    orderBy: { name: "asc" },
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

  return (
    <PassClient
      pass={serializedPass}
      clubs={serializedClubs}
      museums={serializedMuseums}
    />
  );
}
