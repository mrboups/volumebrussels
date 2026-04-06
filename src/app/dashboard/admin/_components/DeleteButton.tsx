"use client";

import { useTransition } from "react";

export default function DeleteButton({
  action,
  label = "Delete",
}: {
  action: () => Promise<void>;
  label?: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
      onClick={() => {
        if (!confirm("Are you sure you want to delete this? This action cannot be undone.")) return;
        startTransition(async () => {
          await action();
        });
      }}
    >
      {isPending ? "Deleting..." : label}
    </button>
  );
}
