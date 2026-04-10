"use client";

import { useState } from "react";

interface BuyTicketButtonProps {
  eventId: string;
  pricingPhaseId: string;
  disabled?: boolean;
}

export default function BuyTicketButton({
  eventId,
  pricingPhaseId,
  disabled = false,
}: BuyTicketButtonProps) {
  const [loading, setLoading] = useState(false);

  if (disabled) {
    return (
      <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
        Sales Ended
      </span>
    );
  }

  async function handleBuy() {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/checkout/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, pricingPhaseId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start checkout");
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleBuy}
      disabled={loading}
      className="bg-black text-white px-8 py-3.5 rounded-full text-sm font-semibold tracking-wide hover:bg-gray-900 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait"
    >
      {loading ? "Redirecting..." : "Buy Ticket"}
    </button>
  );
}
