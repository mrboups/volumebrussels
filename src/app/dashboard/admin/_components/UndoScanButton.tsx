"use client";

import { useState, useTransition } from "react";
import { undoPassScan } from "../_actions";

export default function UndoScanButton({ scanId }: { scanId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  function handleClick() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await undoPassScan(scanId);
      if (res?.error) {
        setError(res.error);
        setConfirming(false);
      }
      // success: page revalidates, row disappears
    });
  }

  function handleCancel() {
    setConfirming(false);
    setError(null);
  }

  if (error) {
    return (
      <span className="text-xs text-red-600" title={error}>
        {error}
      </span>
    );
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleClick}
          disabled={pending}
          className="text-xs font-semibold text-red-600 hover:text-red-800 disabled:opacity-50"
        >
          {pending ? "Undoing..." : "Confirm undo"}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={pending}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-xs font-medium text-red-600 hover:text-red-800"
    >
      Undo
    </button>
  );
}
