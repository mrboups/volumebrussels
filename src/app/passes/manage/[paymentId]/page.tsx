import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import PassAssignForm from "./PassAssignForm";

export const dynamic = "force-dynamic";

export default async function ManagePassesPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const { paymentId } = await params;

  const passes = await db.pass.findMany({
    where: { stripePaymentId: paymentId },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { email: true, name: true } } },
  });

  if (passes.length === 0) {
    notFound();
  }

  // The first pass belongs to the buyer
  const buyerUserId = passes[0].userId;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        <h1 className="text-2xl font-bold text-center">
          Manage Your Passes
        </h1>
        <p className="mt-2 text-center text-sm text-gray-500">
          You purchased {passes.length} pass{passes.length > 1 ? "es" : ""}. Assign extra passes by entering an email address.
        </p>

        <div className="mt-8 space-y-4">
          {passes.map((pass, index) => {
            const isBuyerPass = index === 0;
            const isAssigned = pass.userId !== buyerUserId || isBuyerPass;

            return (
              <div
                key={pass.id}
                className="border border-gray-200 rounded-xl p-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold">
                      Pass #{index + 1}
                    </span>
                    {isBuyerPass && (
                      <span className="ml-2 text-xs bg-black text-white px-2 py-0.5 rounded-full">
                        Yours
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 uppercase tracking-wide">
                    {pass.type}
                  </span>
                </div>

                {isBuyerPass ? (
                  <div className="mt-3">
                    <p className="text-sm text-gray-500">{pass.user.email}</p>
                    <Link
                      href={`/pass/${pass.id}`}
                      className="inline-block mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      View Pass
                    </Link>
                  </div>
                ) : isAssigned && pass.userId !== buyerUserId ? (
                  <div className="mt-3">
                    <p className="text-sm text-green-700">
                      Assigned to {pass.user.email}
                    </p>
                    <Link
                      href={`/pass/${pass.id}`}
                      className="inline-block mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      View Pass
                    </Link>
                  </div>
                ) : (
                  <PassAssignForm passId={pass.id} />
                )}
              </div>
            );
          })}
        </div>

        <Link
          href="/"
          className="block mt-8 text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Back to homepage
        </Link>
      </div>
    </div>
  );
}
