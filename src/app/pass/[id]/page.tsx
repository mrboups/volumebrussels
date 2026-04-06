export default async function PassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md p-8 text-center">
        <h1 className="text-2xl font-bold mb-2">Pass</h1>
        <p className="text-neutral-400 text-sm">{id}</p>
      </div>
    </main>
  );
}
