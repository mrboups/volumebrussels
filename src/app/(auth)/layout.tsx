import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4">
      <div className="mb-8">
        <Link
          href="/"
          className="text-3xl font-extrabold tracking-widest text-white"
        >
          VOLUME
        </Link>
      </div>
      {children}
    </div>
  );
}
