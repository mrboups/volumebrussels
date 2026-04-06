import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

// TEST PRICES — change to 2900/4800 for production
const PASS_PRICES: Record<string, { amount: number; name: string }> = {
  night: { amount: 50, name: "Night Pass — One night of clubbing" },
  weekend: { amount: 50, name: "Weekend Pass — 48h Clubbing Weekend" },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { passType, resellerId } = body as {
      passType: string;
      resellerId?: string;
    };

    const passConfig = PASS_PRICES[passType];
    if (!passConfig) {
      return NextResponse.json({ error: "Invalid pass type" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: passConfig.name,
              description:
                passType === "night"
                  ? "Skip line access to 2 clubs + museums"
                  : "Unlimited access to all clubs + museums",
            },
            unit_amount: passConfig.amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        passType,
        ...(resellerId ? { resellerId } : {}),
      },
      locale: "en",
      currency: "eur",
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
