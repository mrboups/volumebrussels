import Link from "next/link";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  let passId: string | null = null;
  let passType: string | null = null;

  if (session_id) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(session_id);
      passType = session.metadata?.passType || null;

      // Find the pass created by the webhook
      if (session.payment_intent) {
        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent.id;
        const pass = await db.pass.findFirst({
          where: { stripePaymentId: paymentIntentId },
        });
        if (pass) {
          passId = pass.id;
        }
      }
    } catch {
      // Session retrieval failed, show generic success
    }
  }

  const isNight = passType === "night";
  const passLabel = isNight ? "Night Pass" : "Weekend Pass";

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="mt-6 text-3xl font-extrabold">Payment Confirmed!</h1>

        <p className="mt-4 text-gray-500 leading-relaxed">
          {passType
            ? `Your ${passLabel} has been confirmed. Check your email for the pass link.`
            : "Your payment has been confirmed. Check your email for details."}
        </p>

        {passId ? (
          <Link
            href={`/pass/${passId}`}
            className="inline-block mt-8 bg-black text-white font-semibold uppercase tracking-wide text-sm px-8 py-3.5 hover:bg-gray-900 transition-colors"
          >
            View Your Pass
          </Link>
        ) : (
          <p className="mt-8 text-sm text-gray-400">
            Your pass is being created. You will receive an email shortly with
            your pass link.
          </p>
        )}

        <Link
          href="/"
          className="block mt-6 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Back to homepage
        </Link>
      </div>
    </div>
  );
}
