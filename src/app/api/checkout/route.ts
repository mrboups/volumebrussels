import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

// Stripe Price IDs (TEST: 0.50 EUR — create new prices at 29/48 EUR for production)
const PASS_STRIPE_PRICES: Record<string, string> = {
  night: "price_1TJNTOHKSMaEcP9CbjAE7NIi",
  weekend: "price_1TJNTOHKSMaEcP9CEbGlmYtK",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { passType, resellerId, quantity: rawQuantity } = body as {
      passType: string;
      resellerId?: string;
      quantity?: number;
    };

    const quantity = Math.max(1, Math.min(10, Math.floor(Number(rawQuantity) || 1)));

    const priceId = PASS_STRIPE_PRICES[passType];
    if (!priceId) {
      return NextResponse.json({ error: "Invalid pass type" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity,
          adjustable_quantity: {
            enabled: true,
            minimum: 1,
            maximum: 10,
          },
        },
      ],
      metadata: {
        passType,
        ...(resellerId ? { resellerId } : {}),
      },
      locale: "en",
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/buy-ticket`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
