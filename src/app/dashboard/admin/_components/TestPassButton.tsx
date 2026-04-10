"use client";

import { useState } from "react";

export default function TestPassButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<"night" | "weekend" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleBuy(passType: "night" | "weekend") {
    setLoading(passType);
    setError(null);
    try {
      const res = await fetch("/api/checkout/test-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passType }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Failed to create checkout");
      }
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setLoading(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 border border-gray-300 bg-white text-gray-800 text-xs font-semibold uppercase tracking-wide px-3 py-2 rounded-md hover:bg-gray-50 transition-colors"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 2.3A1 1 0 0 0 5.4 17H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-9 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"
          />
        </svg>
        Buy Test Pass
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => !loading && setOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Buy a test pass
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Uses the legacy €0.50 Stripe price to validate the full
                  purchase flow.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !loading && setOpen(false)}
                disabled={!!loading}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                aria-label="Close"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleBuy("night")}
                disabled={!!loading}
                className="flex items-center justify-between px-4 py-3 border border-gray-300 rounded-md hover:border-black hover:bg-gray-50 transition-colors disabled:opacity-50 text-left"
              >
                <span className="text-sm font-semibold text-gray-900">
                  Night Pass
                </span>
                <span className="text-xs text-gray-500">
                  {loading === "night" ? "Redirecting..." : "€0.50 test"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleBuy("weekend")}
                disabled={!!loading}
                className="flex items-center justify-between px-4 py-3 border border-gray-300 rounded-md hover:border-black hover:bg-gray-50 transition-colors disabled:opacity-50 text-left"
              >
                <span className="text-sm font-semibold text-gray-900">
                  Weekend Pass
                </span>
                <span className="text-xs text-gray-500">
                  {loading === "weekend" ? "Redirecting..." : "€0.50 test"}
                </span>
              </button>
            </div>

            {error && (
              <div className="mt-3 text-sm rounded-md px-3 py-2 bg-red-50 text-red-700 border border-red-200">
                {error}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
