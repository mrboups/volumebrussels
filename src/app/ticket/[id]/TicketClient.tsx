"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import SwipeSlider from "@/components/SwipeSlider";

interface Club {
  id: string;
  name: string;
  slug: string;
  address: string;
  pictures: string[];
  createdAt: string;
  updatedAt: string;
}

interface Event {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  date: string;
  club: Club | null;
  createdAt: string;
  updatedAt: string;
}

interface Ticket {
  id: string;
  eventId: string;
  userId: string;
  status: string;
  pricePaid: number;
  pricingPhase: string;
  validatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  event: Event;
}

interface TicketClientProps {
  ticket: Ticket;
}

// Force Europe/Brussels for every customer-visible date on the ticket
// page. Without this, rendering happens in the runtime's default
// timezone (UTC on Railway's base image) and an event stored at
// "11 April 2026 00:00 Brussels" = "10 April 2026 22:00 UTC" shows up
// as "Friday, 10 April" instead of "Saturday, 11 April".
function formatEventDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Brussels",
  });
}

function formatTimestamp(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Brussels",
  });
}

function getClubImage(slug: string): string {
  if (slug === "umi") return `/clubs/${slug}.png`;
  return `/clubs/${slug}.jpg`;
}

export default function TicketClient({ ticket: initialTicket }: TicketClientProps) {
  const [ticket, setTicket] = useState<Ticket>(initialTicket);
  const [error, setError] = useState<string | null>(null);

  // Force html/body backgrounds black so iOS overscroll and Crisp gutter
  // don't reveal a white border above/below the dark ticket.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.backgroundColor;
    const prevBody = body.style.backgroundColor;
    html.style.backgroundColor = "#000";
    body.style.backgroundColor = "#000";
    return () => {
      html.style.backgroundColor = prevHtml;
      body.style.backgroundColor = prevBody;
    };
  }, []);

  const isValidated = ticket.status === "used" || ticket.validatedAt !== null;

  const handleValidate = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/tickets/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId: ticket.id }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to validate ticket");
      throw new Error(data.error);
    }

    setTicket(data.ticket);
  }, [ticket.id]);

  const coverImage =
    ticket.event.coverImage || (ticket.event.club ? getClubImage(ticket.event.club.slug) : "/clubs/default.jpg");

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center px-4 pt-2 pb-4">
          <h1 className="text-2xl font-extrabold uppercase tracking-widest mb-1">
            VOLUME
          </h1>
          <p className="text-neutral-400 text-sm font-medium">
            Show this ticket at the event.
          </p>
        </div>

        {/* Warnings */}
        <div className="px-4 mb-4 flex flex-col gap-3">
          <div className="bg-yellow-900/30 border border-yellow-700/50 px-4 py-3">
            <p className="text-yellow-400 text-xs font-bold uppercase tracking-wide text-center">
              This is a ticket without QR Code, show it at the entrance to enter the venue.
            </p>
          </div>
        </div>

        {/* Cover Image */}
        <div className="relative w-full h-56">
          <Image
            src={coverImage}
            alt={ticket.event.name}
            fill
            className="object-cover"
            sizes="(max-width: 448px) 100vw, 448px"
            priority
          />
        </div>

        {/* Event Info */}
        <div className="px-4 py-5">
          <h2 className="text-xl font-bold uppercase tracking-wide">
            {ticket.event.name}
          </h2>
          <p className="text-neutral-400 text-sm mt-1">
            {formatEventDate(ticket.event.date)}
          </p>
          <div className="mt-3">
            <p className="text-white text-sm font-semibold">
              {ticket.event.club?.name || "Venue TBA"}
            </p>
            <p className="text-neutral-500 text-xs mt-0.5">
              {ticket.event.club?.address || ""}
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 mb-4">
            <div className="bg-red-900/30 border border-red-700/50 px-4 py-3">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          </div>
        )}

        {/* Validation Area */}
        <div className="px-4 pb-8">
          {isValidated ? (
            <div className="bg-green-900/30 border border-green-700/50 p-6 text-center">
              <svg
                className="w-16 h-16 text-green-500 mx-auto mb-3"
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
              <p className="text-green-400 text-lg font-bold uppercase tracking-wide">
                Ticket Validated
              </p>
              {ticket.validatedAt && (
                <p className="text-green-600 text-xs mt-2">
                  {formatTimestamp(ticket.validatedAt)}
                </p>
              )}
            </div>
          ) : (
            <>
              <SwipeSlider
                onComplete={handleValidate}
                label="Swipe to check in"
                completedLabel="Checked in"
              />
              <div className="mt-4 bg-red-900/30 border border-red-700/50 px-4 py-3">
                <p className="text-red-400 text-xs font-bold uppercase tracking-wide text-center">
                  Do not swipe the ticket by yourself or you will lose access to the event.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
