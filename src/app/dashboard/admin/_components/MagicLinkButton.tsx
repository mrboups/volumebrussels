"use client";

import { useState, useTransition } from "react";

export default function MagicLinkButton({
  type,
  entityId,
}: {
  type: "club" | "reseller";
  entityId: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function generate() {
    startTransition(async () => {
      setError(null);
      try {
        const res = await fetch("/api/magic-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, entityId }),
        });
        const data = await res.json();
        if (data.error) {
          setError(data.error);
        } else {
          setUrl(data.url);
        }
      } catch {
        setError("Failed to generate link");
      }
    });
  }

  async function copyToClipboard() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  if (url) {
    return (
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={url}
          className="text-xs border border-gray-200 rounded px-2 py-1 w-48 truncate bg-gray-50"
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <button
          onClick={copyToClipboard}
          className="text-xs font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={generate}
        disabled={isPending}
        className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 whitespace-nowrap"
      >
        {isPending ? "Generating..." : "Generate Link"}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
