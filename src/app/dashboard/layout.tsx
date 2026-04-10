"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/dashboard/admin", label: "Admin" },
  { href: "/dashboard/club", label: "Club" },
  { href: "/dashboard/accounting", label: "Accounting" },
  { href: "/dashboard/reseller", label: "Reseller" },
  { href: "/dashboard/passes", label: "Passes" },
  { href: "/dashboard/tickets", label: "Tickets" },
  { href: "/dashboard/users", label: "Users" },
];

const adminSubItems = [
  { href: "/dashboard/admin/clubs", label: "Clubs" },
  { href: "/dashboard/admin/museums", label: "Museums" },
  { href: "/dashboard/admin/events", label: "Events" },
  { href: "/dashboard/admin/articles", label: "Articles" },
  { href: "/dashboard/admin/giveaways", label: "Giveaways" },
  { href: "/dashboard/admin/resellers", label: "Resellers" },
  { href: "/dashboard/admin/reports", label: "Reports" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Magic link mode: hide full nav, show only current section
  const magicToken = searchParams.get("token");
  const isMagicLink = !!magicToken;
  const isClubMagic = isMagicLink && pathname.startsWith("/dashboard/club");
  const isResellerMagic = isMagicLink && pathname.startsWith("/dashboard/reseller");

  // If magic link mode: minimal layout, no sidebar
  if (isMagicLink) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <Link href="/" className="text-xl font-extrabold tracking-tight text-black">
              VOLUME
            </Link>
            <span className="text-sm text-gray-500">
              {isClubMagic ? "Club Portal" : isResellerMagic ? "Reseller Portal" : "Portal"}
            </span>
          </div>
        </div>
        <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    );
  }

  const sidebar = (
    <>
      <div className="p-6 pb-4 border-b border-gray-100 flex items-center justify-between">
        <Link href="/" className="text-xl font-extrabold tracking-tight text-black">
          VOLUME
        </Link>
        <button
          className="lg:hidden text-gray-400 hover:text-black cursor-pointer"
          onClick={() => setSidebarOpen(false)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <nav className="p-4 space-y-1 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const isSection = pathname.startsWith(item.href);
          return (
            <div key={item.href}>
              <Link
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-black text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-black"
                }`}
              >
                {item.label}
              </Link>
              {item.href === "/dashboard/admin" && (
                <div className="ml-3 mt-1 space-y-0.5">
                  {adminSubItems.map((sub) => {
                    const subActive = pathname.startsWith(sub.href);
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`block px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          subActive
                            ? "bg-gray-200 text-black"
                            : "text-gray-500 hover:bg-gray-100 hover:text-black"
                        }`}
                      >
                        {sub.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-100 space-y-2">
        <Link
          href="/"
          className="block px-3 py-2 rounded-md text-sm text-gray-500 hover:bg-gray-100 hover:text-black transition-colors"
        >
          &larr; Back to site
        </Link>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard/admin" className="text-lg font-extrabold tracking-tight text-black">
          VOLUME
        </Link>
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-1 cursor-pointer"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white flex flex-col">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-col fixed top-0 bottom-0 left-0">
        {sidebar}
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-6 p-4 sm:p-6 lg:p-8 overflow-auto min-h-screen">
        {children}
      </main>
    </div>
  );
}
