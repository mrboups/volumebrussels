"use client";

import { useState } from "react";

export default function PassAssignForm({
  passId,
  paymentId,
}: {
  passId: string;
  paymentId: string;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [assignedEmail, setAssignedEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (loading || !email) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/passes/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passId,
          paymentId,
          email,
          name: name || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to assign pass");
      }

      setSuccess(true);
      setAssignedEmail(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="mt-3">
        <p className="text-sm text-green-700">
          Pass sent to {assignedEmail}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleAssign} className="mt-3 space-y-2">
      <input
        type="email"
        required
        placeholder="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
      />
      <input
        type="text"
        placeholder="Name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
      />
      <button
        type="submit"
        disabled={loading || !email}
        className="w-full bg-black text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {loading ? "Sending..." : "Send Pass"}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
  );
}
