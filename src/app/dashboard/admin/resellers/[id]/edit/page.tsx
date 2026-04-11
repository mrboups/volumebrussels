import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import ResellerForm from "../../../_components/ResellerForm";
import { updateReseller } from "../../../_actions";

export const dynamic = "force-dynamic";

export default async function EditResellerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reseller = await db.reseller.findUnique({
    where: { id },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!reseller) notFound();

  const updateAction = updateReseller.bind(null, reseller.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Edit Reseller: {reseller.user.name}</h1>
      <ResellerForm
        reseller={{
          id: reseller.id,
          name: reseller.user.name || "",
          email: reseller.user.email,
          passCommissionTiers: reseller.passCommissionTiers,
          ticketCommissionTiers: reseller.ticketCommissionTiers,
          isActive: reseller.isActive,
        }}
        action={updateAction}
      />
    </div>
  );
}
