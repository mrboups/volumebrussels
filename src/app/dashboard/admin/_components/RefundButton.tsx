"use client";

import { useState, useTransition } from "react";
import { refundPass, refundTicket } from "../_actions";

interface Props {
  target: "pass" | "ticket";
  id: string;
  amount: number;
  /** True if the payment went through Stripe (pi_...) — controls the
   *  confirmation copy so admins know money will leave Stripe. */
  isStripeBacked: boolean;
  /** Compact = inline text button, otherwise the primary variant. */
  compact?: boolean;
}

const eur = new Intl.NumberFormat("fr-BE", {
  style: "currency",
  currency: "EUR",
});

export default function RefundButton({
  target,
  id,
  amount,
  isStripeBacked,
  compact = false,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [feedback, setFeedback] = useState<
    { kind: "error" | "success"; text: string } | null
  >(null);

  function handleClick(e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    if (!confirming) {
      setConfirming(true);
      setFeedback(null);
      return;
    }
    setFeedback(null);
    startTransition(async () => {
      const res =
        target === "pass" ? await refundPass(id) : await refundTicket(id);
      if (res?.error) {
        setFeedback({ kind: "error", text: res.error });
        setConfirming(false);
      } else {
        setFeedback({
          kind: "success",
          text: isStripeBacked
            ? "Refunded on Stripe + local status"
            : "Marked as refunded (no Stripe charge)",
        });
        setConfirming(false);
      }
    });
  }

  function handleCancel(e: React.MouseEvent) {
    e.stopPropagation();
    setConfirming(false);
    setFeedback(null);
  }

  if (compact) {
    if (confirming) {
      return (
        <span className="inline-flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleClick}
            disabled={pending}
            className="text-xs font-semibold text-red-700 hover:text-red-900 disabled:opacity-50"
          >
            {pending ? "Refunding..." : "Confirm refund"}
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
      <>
        <button
          type="button"
          onClick={handleClick}
          className="text-xs font-medium text-red-600 hover:text-red-800"
        >
          Refund
        </button>
        {feedback && (
          <span
            className={`ml-2 text-xs ${
              feedback.kind === "error" ? "text-red-600" : "text-green-600"
            }`}
          >
            {feedback.text}
          </span>
        )}
      </>
    );
  }

  // Primary variant — used on the pass detail page header
  return (
    <div className="flex flex-col items-end gap-2">
      {!confirming ? (
        <button
          type="button"
          onClick={handleClick}
          className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 text-sm font-semibold rounded-md hover:bg-red-50 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 10h10a8 8 0 018 8v2M3 10l6-6m-6 6l6 6"
            />
          </svg>
          Refund {eur.format(amount)}
        </button>
      ) : (
        <div className="flex flex-col items-end gap-2 max-w-md">
          <p className="text-xs text-gray-600 text-right">
            {isStripeBacked
              ? `This will refund ${eur.format(amount)} on Stripe and mark the ${target} as refunded. The customer will be notified by email.`
              : `This ${target} has no Stripe charge. Only the local status will change to refunded. No email will be sent.`}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={pending}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleClick}
              disabled={pending}
              className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {pending ? "Refunding..." : "Confirm refund"}
            </button>
          </div>
        </div>
      )}
      {feedback && (
        <p
          className={`text-xs ${
            feedback.kind === "error" ? "text-red-600" : "text-green-600"
          }`}
        >
          {feedback.text}
        </p>
      )}
    </div>
  );
}
