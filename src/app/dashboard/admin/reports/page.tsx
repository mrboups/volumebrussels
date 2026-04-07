import { db } from "@/lib/db";
import ReportsClient from "./_components/ReportsClient";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const clubs = await db.club.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, payPerVisit: true, contactEmail: true },
  });

  const resellers = await db.reseller.findMany({
    where: { isActive: true },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  const resellersData = resellers.map((r) => ({
    id: r.id,
    name: r.user.name || r.user.email,
    email: r.user.email,
    commissionRate: r.commissionRate,
  }));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
      <ReportsClient clubs={clubs} resellers={resellersData} />
    </div>
  );
}
