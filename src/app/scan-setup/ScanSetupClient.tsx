"use client";

import { useEffect, useState } from "react";
import {
  getScannerSecret,
  setScannerSecret,
  clearScannerSecret,
} from "@/lib/scanner";

export default function ScanSetupClient() {
  const [status, setStatus] = useState<
    | { kind: "initial" }
    | { kind: "saved"; masked: string }
    | { kind: "cleared" }
    | { kind: "missing" }
  >({ kind: "initial" });

  useEffect(() => {
    // Read ?secret= from the URL on mount, save it, then strip it from the URL.
    const url = new URL(window.location.href);
    const provided = url.searchParams.get("secret");
    if (provided) {
      setScannerSecret(provided);
      const masked = provided.slice(0, 4) + "…" + provided.slice(-4);
      setStatus({ kind: "saved", masked });
      url.searchParams.delete("secret");
      window.history.replaceState({}, "", url.toString());
    } else {
      const existing = getScannerSecret();
      if (existing) {
        const masked = existing.slice(0, 4) + "…" + existing.slice(-4);
        setStatus({ kind: "saved", masked });
      } else {
        setStatus({ kind: "missing" });
      }
    }
  }, []);

  function handleClear() {
    clearScannerSecret();
    setStatus({ kind: "cleared" });
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-extrabold uppercase tracking-widest text-center mb-1">
          Volume
        </h1>
        <p className="text-center text-neutral-400 text-sm mb-8">
          Scanner Setup
        </p>

        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-4">
          {status.kind === "initial" && (
            <p className="text-sm text-neutral-400">Loading…</p>
          )}

          {status.kind === "saved" && (
            <>
              <div className="flex items-center gap-2 text-green-400">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-sm font-semibold uppercase tracking-wide">
                  Scanner ready
                </span>
              </div>
              <p className="text-sm text-neutral-300">
                This device is now set up to scan Volume passes and tickets.
                You can close this page and open the customer's pass or
                ticket directly on their phone; swipe will work.
              </p>
              <p className="text-xs text-neutral-500 font-mono">
                Credential: {status.masked}
              </p>
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-neutral-500 hover:text-red-400 underline"
              >
                Clear credential
              </button>
            </>
          )}

          {status.kind === "missing" && (
            <>
              <p className="text-sm text-neutral-300">
                No scanner credential found on this device.
              </p>
              <p className="text-xs text-neutral-500">
                Open the setup link provided by the Volume team. It looks
                like{" "}
                <code className="text-neutral-300">
                  /scan-setup?secret=…
                </code>
                .
              </p>
            </>
          )}

          {status.kind === "cleared" && (
            <p className="text-sm text-neutral-300">
              Credential cleared. This device can no longer validate passes
              or tickets until you reopen the setup link.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
