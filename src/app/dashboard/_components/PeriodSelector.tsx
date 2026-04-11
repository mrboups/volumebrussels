"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";

interface Props {
  choices: { key: string; label: string }[];
}

export default function PeriodSelector({ choices }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const currentKey = searchParams.get("period") ?? "all";
  const currentFrom = searchParams.get("from") ?? "";
  const currentTo = searchParams.get("to") ?? "";
  const isCustom = !!(currentFrom && currentTo);

  const [mode, setMode] = useState<"preset" | "custom">(isCustom ? "custom" : "preset");
  const [from, setFrom] = useState(currentFrom);
  const [to, setTo] = useState(currentTo);

  function applyPreset(key: string) {
    const params = new URLSearchParams();
    params.set("period", key);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  function applyCustom() {
    if (!from || !to) return;
    const params = new URLSearchParams();
    params.set("from", from);
    params.set("to", to);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMode("preset")}
          className={`text-xs font-semibold px-2 py-1 rounded ${
            mode === "preset"
              ? "bg-black text-white"
              : "bg-white border border-gray-300 text-gray-600 hover:border-gray-400"
          }`}
        >
          Period
        </button>
        <button
          type="button"
          onClick={() => setMode("custom")}
          className={`text-xs font-semibold px-2 py-1 rounded ${
            mode === "custom"
              ? "bg-black text-white"
              : "bg-white border border-gray-300 text-gray-600 hover:border-gray-400"
          }`}
        >
          Custom range
        </button>
      </div>

      {mode === "preset" ? (
        <select
          value={currentKey}
          onChange={(e) => applyPreset(e.target.value)}
          disabled={pending}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-black focus:border-black bg-white"
        >
          {choices.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
          />
          <span className="text-xs text-gray-500">to</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={applyCustom}
            disabled={pending || !from || !to}
            className="text-xs font-semibold px-3 py-1.5 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      )}
      {pending && <span className="text-xs text-gray-400">…</span>}
    </div>
  );
}
