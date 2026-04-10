"use client";
import { useTransition } from "react";

export default function ToggleSalesButton({
  id,
  salesEnded,
  action,
}: {
  id: string;
  salesEnded: boolean;
  action: (id: string) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(() => action(id))}
      disabled={pending}
      className={`text-sm font-medium disabled:opacity-50 cursor-pointer ${
        salesEnded ? "text-green-600 hover:text-green-800" : "text-orange-600 hover:text-orange-800"
      }`}
    >
      {salesEnded ? "Resume Sales" : "End Sales"}
    </button>
  );
}
