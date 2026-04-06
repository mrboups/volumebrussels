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

        <h1 className="mt-6 text-2xl font-bold">Thank you for your purchase.</h1>

        <div className="mt-6 text-gray-600 leading-relaxed text-sm space-y-4">
          <p>
            Your Party Pass link will be sent to you by email shortly.<br />
            Please allow up to 1 hour for the email to arrive.
          </p>
          <p className="text-gray-400">
            Le lien vers votre Party Pass vous sera envoyé prochainement par e-mail.<br />
            Veuillez noter que l&apos;e-mail peut prendre 1 heure avant d&apos;arriver.
          </p>
          <p className="text-gray-400">
            De link naar uw Party Pass wordt binnenkort per e-mail naar u verzonden.<br />
            Houd rekening met een levertijd van maximaal 1 uur voor de e-mail.
          </p>
        </div>

        <p className="mt-6 text-sm font-semibold text-gray-900">
          If you have any questions, our 24/7 support chat is here to help.
        </p>

        {passId && (
          <Link
            href={`/pass/${passId}`}
            className="inline-block mt-8 bg-black text-white font-semibold uppercase tracking-wide text-sm px-8 py-3.5 rounded-full hover:bg-gray-900 transition-colors"
          >
            View Your Pass
          </Link>
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
