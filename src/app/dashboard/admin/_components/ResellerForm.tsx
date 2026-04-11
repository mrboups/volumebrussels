"use client";

import { useState } from "react";
import TierEditor from "./TierEditor";
import type { CommissionTier } from "@/lib/pricing";
import { parseTiers } from "@/lib/pricing";

interface ResellerData {
  id?: string;
  name: string;
  email: string;
  passCommissionTiers: unknown;
  ticketCommissionTiers: unknown;
  isActive: boolean;
}

export default function ResellerForm({
  reseller,
  action,
}: {
  reseller?: ResellerData;
  action: (formData: FormData) => Promise<void>;
}) {
  const [passTiers, setPassTiers] = useState<CommissionTier[]>(() =>
    parseTiers(reseller?.passCommissionTiers)
  );
  const [ticketTiers, setTicketTiers] = useState<CommissionTier[]>(() =>
    parseTiers(reseller?.ticketCommissionTiers)
  );

  function handleSubmit(formData: FormData) {
    formData.set("passCommissionTiers", JSON.stringify(passTiers));
    formData.set("ticketCommissionTiers", JSON.stringify(ticketTiers));
    return action(formData);
  }

  return (
    <form action={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input
            name="name"
            required
            defaultValue={reseller?.name ?? ""}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input
            name="email"
            type="email"
            required
            defaultValue={reseller?.email ?? ""}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black"
          />
        </div>
      </div>

      <TierEditor
        label="Pass commission"
        helper="How much this reseller earns on every pass they sell. Add tiers for price-based rates, e.g. 8% below €30, 4% above."
        tiers={passTiers}
        onChange={setPassTiers}
      />

      <TierEditor
        label="Ticket commission"
        helper="How much this reseller earns on every ticket they sell. Same tier logic as passes."
        tiers={ticketTiers}
        onChange={setTicketTiers}
      />

      <div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            name="isActive"
            type="checkbox"
            defaultChecked={reseller?.isActive ?? true}
            className="rounded border-gray-300"
          />
          Active
        </label>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
        >
          {reseller ? "Update Reseller" : "Create Reseller"}
        </button>
        <a
          href="/dashboard/admin/resellers"
          className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
