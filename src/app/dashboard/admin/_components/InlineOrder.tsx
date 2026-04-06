"use client";

import { useState } from "react";

export default function InlineOrder({
  id,
  type,
  value,
  action,
}: {
  id: string;
  type: "club" | "museum";
  value: number;
  action: (id: string, type: "club" | "museum", order: number) => Promise<void>;
}) {
  const [order, setOrder] = useState(value);
  const [saving, setSaving] = useState(false);

  async function handleBlur() {
    if (order === value) return;
    setSaving(true);
    await action(id, type, order);
    setSaving(false);
  }

  return (
    <input
      type="number"
      value={order}
      onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
      onBlur={handleBlur}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      className={`w-14 border border-gray-200 rounded px-2 py-1 text-sm text-center focus:ring-1 focus:ring-black focus:border-black ${saving ? "opacity-50" : ""}`}
    />
  );
}
