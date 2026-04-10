"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition, useEffect } from "react";

interface Props {
  placeholder?: string;
}

export default function SearchBar({ placeholder = "Search..." }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const [pending, startTransition] = useTransition();

  // Debounce URL updates so the user isn't waiting for every keystroke.
  useEffect(() => {
    const handle = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set("q", value.trim());
      } else {
        params.delete("q");
      }
      const qs = params.toString();
      startTransition(() => {
        router.replace(`${pathname}${qs ? `?${qs}` : ""}`);
      });
    }, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative max-w-md">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-md pl-9 pr-9 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black"
      />
      {pending && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
          …
        </span>
      )}
    </div>
  );
}
