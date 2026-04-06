"use client";

import { useState } from "react";

interface PricingCardProps {
  title: string;
  price: string;
  subtitle: string;
  features: string[];
  filled?: boolean;
  passType: "night" | "weekend";
}

export default function PricingCard({
  title,
  price,
  subtitle,
  features,
  filled = false,
  passType,
}: PricingCardProps) {
  const [loading, setLoading] = useState(false);

  async function handleBuy() {
    if (loading) return;
    setLoading(true);

    try {
      // Check for reseller tracking parameter
      const urlParams = new URLSearchParams(window.location.search);
      const resellerId = urlParams.get("ref") || undefined;

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passType, resellerId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to start checkout");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-8 flex flex-col items-center text-center w-full max-w-sm shadow-sm">
      <h3 className="text-2xl font-extrabold">{title}</h3>
      <p className="text-gray-500 mt-2 text-sm">{subtitle}</p>
      <p className="text-5xl font-extrabold mt-6">{price}</p>

      <ul className="mt-8 space-y-3 w-full text-left">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <span className="mt-0.5 text-black font-bold">&#10003;</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={handleBuy}
        disabled={loading}
        className={`mt-8 w-full py-3.5 text-sm font-semibold tracking-wide text-center transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait rounded-full ${
          filled
            ? "bg-black text-white hover:bg-gray-900"
            : "border-2 border-black text-black hover:bg-black hover:text-white"
        }`}
      >
        {loading ? "Redirecting..." : "Buy Now"}
      </button>
    </div>
  );
}
