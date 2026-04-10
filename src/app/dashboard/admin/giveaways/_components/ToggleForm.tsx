"use client";

import { useTransition } from "react";

interface Props {
  id: string;
  isActive: boolean;
  toggleAction: (id: string) => Promise<{ success?: boolean; error?: string }>;
}

export default function ToggleForm({ id, isActive, toggleAction }: Props) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await toggleAction(id);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded transition-colors disabled:opacity-50 ${
        isActive
          ? "bg-green-50 text-green-700 hover:bg-green-100"
          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isActive ? "bg-green-500" : "bg-gray-400"
        }`}
      />
      {isActive ? "Active" : "Inactive"}
    </button>
  );
}
