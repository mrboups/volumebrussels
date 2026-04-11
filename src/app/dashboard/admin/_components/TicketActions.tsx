"use client";

import { useState, useTransition } from "react";
import {
  resendTicketEmail,
  updateTicketEmail,
  undoTicketValidation,
} from "../_actions";
import RefundButton from "./RefundButton";

export default function TicketActions({
  ticketId,
  currentEmail,
  isValidated = false,
  isRefunded = false,
  price = 0,
  isStripeBacked = false,
}: {
  ticketId: string;
  currentEmail: string;
  isValidated?: boolean;
  isRefunded?: boolean;
  price?: number;
  isStripeBacked?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [confirmingUndo, setConfirmingUndo] = useState(false);
  const [email, setEmail] = useState(currentEmail);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  function handleResend() {
    setFeedback(null);
    startTransition(async () => {
      const result = await resendTicketEmail(ticketId);
      if (result.error) {
        setFeedback({ type: "error", message: result.error });
      } else {
        setFeedback({ type: "success", message: "Email sent!" });
      }
    });
  }

  function handleSaveAndSend() {
    setFeedback(null);
    startTransition(async () => {
      const result = await updateTicketEmail(ticketId, email);
      if (result.error) {
        setFeedback({ type: "error", message: result.error });
      } else {
        setFeedback({ type: "success", message: "Email updated & sent!" });
        setEditing(false);
      }
    });
  }

  function handleUndo() {
    if (!confirmingUndo) {
      setConfirmingUndo(true);
      setFeedback(null);
      return;
    }
    setFeedback(null);
    startTransition(async () => {
      const result = await undoTicketValidation(ticketId);
      if (result.error) {
        setFeedback({ type: "error", message: result.error });
        setConfirmingUndo(false);
      } else {
        setFeedback({ type: "success", message: "Check-in undone." });
        setConfirmingUndo(false);
      }
    });
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {!editing ? (
        <>
          <button
            onClick={handleResend}
            disabled={isPending}
            className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded hover:bg-blue-100 disabled:opacity-50"
          >
            {isPending ? "Sending..." : "Resend"}
          </button>
          <button
            onClick={() => {
              setEditing(true);
              setFeedback(null);
            }}
            disabled={isPending}
            className="px-2 py-1 text-xs font-medium bg-gray-50 text-gray-700 rounded hover:bg-gray-100 disabled:opacity-50"
          >
            Edit email
          </button>
          {isValidated && (
            <>
              {confirmingUndo ? (
                <>
                  <button
                    onClick={handleUndo}
                    disabled={isPending}
                    className="px-2 py-1 text-xs font-semibold bg-red-50 text-red-700 rounded hover:bg-red-100 disabled:opacity-50"
                  >
                    {isPending ? "Undoing..." : "Confirm undo"}
                  </button>
                  <button
                    onClick={() => setConfirmingUndo(false)}
                    disabled={isPending}
                    className="px-2 py-1 text-xs font-medium text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={handleUndo}
                  disabled={isPending}
                  className="px-2 py-1 text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                  title="Undo the check-in — ticket goes back to purchased"
                >
                  Undo check-in
                </button>
              )}
            </>
          )}
          {!isRefunded && (
            <RefundButton
              target="ticket"
              id={ticketId}
              amount={price}
              isStripeBacked={isStripeBacked}
              compact
            />
          )}
        </>
      ) : (
        <>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded w-44"
          />
          <button
            onClick={handleSaveAndSend}
            disabled={isPending || !email}
            className="px-2 py-1 text-xs font-medium bg-green-50 text-green-700 rounded hover:bg-green-100 disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save & Send"}
          </button>
          <button
            onClick={() => {
              setEditing(false);
              setEmail(currentEmail);
              setFeedback(null);
            }}
            className="px-2 py-1 text-xs font-medium text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </>
      )}
      {feedback && (
        <span
          className={`text-xs ${
            feedback.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {feedback.message}
        </span>
      )}
    </div>
  );
}
