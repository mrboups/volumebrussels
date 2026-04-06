"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="w-full bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="text-xl font-extrabold tracking-widest uppercase">
          VOLUME PASS
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/offer" className="text-sm font-semibold uppercase tracking-wide hover:opacity-70 transition-opacity">
            Offer
          </Link>
          <Link href="/agenda" className="text-sm font-semibold uppercase tracking-wide hover:opacity-70 transition-opacity">
            Agenda
          </Link>
        </div>

        {/* CTA button */}
        <div className="hidden md:block">
          <Link
            href="#pricing"
            className="bg-black text-white text-sm font-semibold uppercase tracking-wide px-6 py-2.5 hover:bg-gray-900 transition-colors"
          >
            Buy Ticket
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block w-6 h-0.5 bg-black transition-transform ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block w-6 h-0.5 bg-black transition-opacity ${mobileOpen ? "opacity-0" : ""}`} />
          <span className={`block w-6 h-0.5 bg-black transition-transform ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 flex flex-col gap-4">
          <Link href="/offer" className="text-sm font-semibold uppercase tracking-wide pt-4" onClick={() => setMobileOpen(false)}>
            Offer
          </Link>
          <Link href="/agenda" className="text-sm font-semibold uppercase tracking-wide" onClick={() => setMobileOpen(false)}>
            Agenda
          </Link>
          <Link
            href="#pricing"
            className="bg-black text-white text-sm font-semibold uppercase tracking-wide px-6 py-2.5 text-center"
            onClick={() => setMobileOpen(false)}
          >
            Buy Ticket
          </Link>
        </div>
      )}
    </nav>
  );
}
