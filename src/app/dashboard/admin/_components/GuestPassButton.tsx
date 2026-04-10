"use client";

import { useState, useTransition } from "react";
import { createGuestPass } from "../_actions";

export default function GuestPassButton() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [type, setType] = useState<"night" | "weekend">("night");
  const [message, setMessage] = useState<
    { kind: "success" | "error"; text: string } | null
  >(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setEmail("");
    setType("night");
    setMessage(null);
  }

  function handleClose() {
    if (pending) return;
    setOpen(false);
    reset();
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const formData = new FormData();
    formData.set("email", email);
    formData.set("type", type);
    startTransition(async () => {
      const res = await createGuestPass(formData);
      if (res?.error) {
        setMessage({ kind: "error", text: res.error });
      } else {
        setMessage({
          kind: "success",
          text: `Free ${type} pass sent to ${email}.`,
        });
        setEmail("");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 bg-black text-white text-xs font-semibold uppercase tracking-wide px-3 py-2 rounded-md hover:bg-gray-800 transition-colors"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add Guest Pass
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Send a guest pass
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  The recipient will receive a free pass by email.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={pending}
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="guest-email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Recipient email
                </label>
                <input
                  id="guest-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="guest@example.com"
                  disabled={pending}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pass type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["night", "weekend"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      disabled={pending}
                      className={`px-3 py-2 rounded-md border text-sm font-medium transition-colors capitalize disabled:opacity-50 ${
                        type === t
                          ? "border-black bg-black text-white"
                          : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      {t} Pass
                    </button>
                  ))}
                </div>
              </div>

              {message && (
                <div
                  className={`text-sm rounded-md px-3 py-2 ${
                    message.kind === "success"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={pending}
                  className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={pending || !email}
                  className="flex-1 px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {pending ? "Sending..." : "Send pass"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
