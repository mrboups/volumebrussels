import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { isAdminRequest } from "@/lib/session";

// Legacy €0.50 test Prices — kept live specifically so the admin can
// trigger a real Stripe checkout without paying the production €29/€48.
const TEST_PASS_STRIPE_PRICES: Record<string, string> = {
  night: "price_1TJNTOHKSMaEcP9CbjAE7NIi",
  weekend: "price_1TJNTOHKSMaEcP9CEbGlmYtK",
};

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdminRequest())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { passType } = body as { passType?: string };

    const priceId = passType ? TEST_PASS_STRIPE_PRICES[passType] : undefined;
    if (!priceId) {
      return NextResponse.json({ error: "Invalid pass type" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        passType: passType!,
        testPurchase: "true",
      },
      locale: "en",
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard/admin`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Test pass checkout error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
