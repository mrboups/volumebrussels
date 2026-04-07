"use client";

interface ResellerData {
  id?: string;
  name: string;
  email: string;
  commissionRate: number;
  isActive: boolean;
}

export default function ResellerForm({
  reseller,
  action,
}: {
  reseller?: ResellerData;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="space-y-6 max-w-2xl">
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate</label>
        <input
          name="commissionRate"
          type="number"
          step="0.01"
          min="0"
          max="1"
          defaultValue={reseller?.commissionRate ?? 0.08}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black max-w-xs"
        />
        <p className="text-xs text-gray-400 mt-1">e.g. 0.08 = 8%</p>
      </div>

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
