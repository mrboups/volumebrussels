export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r border-neutral-800 p-6">
        <h2 className="text-lg font-bold mb-4">VOLUME</h2>
        <nav className="space-y-2 text-sm text-neutral-400">
          <a href="/dashboard/admin" className="block hover:text-white">Admin</a>
          <a href="/dashboard/club" className="block hover:text-white">Club</a>
          <a href="/dashboard/accounting" className="block hover:text-white">Accounting</a>
          <a href="/dashboard/reseller" className="block hover:text-white">Reseller</a>
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
