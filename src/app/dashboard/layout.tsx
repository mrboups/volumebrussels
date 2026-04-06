"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard/admin", label: "Admin" },
  { href: "/dashboard/club", label: "Club" },
  { href: "/dashboard/accounting", label: "Accounting" },
  { href: "/dashboard/reseller", label: "Reseller" },
];

const adminSubItems = [
  { href: "/dashboard/admin/clubs", label: "Clubs" },
  { href: "/dashboard/admin/museums", label: "Museums" },
  { href: "/dashboard/admin/events", label: "Events" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between">
        <div>
          <div className="p-6 pb-4 border-b border-gray-100">
            <Link href="/" className="text-xl font-extrabold tracking-tight text-black">
              VOLUME
            </Link>
          </div>
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const isSection = pathname.startsWith(item.href);
              return (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-black text-white"
                        : "text-gray-600 hover:bg-gray-100 hover:text-black"
                    }`}
                  >
                    {item.label}
                  </Link>
                  {item.href === "/dashboard/admin" && isSection && (
                    <div className="ml-3 mt-1 space-y-0.5">
                      {adminSubItems.map((sub) => {
                        const subActive = pathname.startsWith(sub.href);
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
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
        </div>
        <div className="p-4 border-t border-gray-100 space-y-2">
          <Link
            href="/"
            className="block px-3 py-2 rounded-md text-sm text-gray-500 hover:bg-gray-100 hover:text-black transition-colors"
          >
            &larr; Back to site
          </Link>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full text-left px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
