import { Resend } from "resend";

let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set in environment variables");
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Volume Brussels <onboarding@resend.dev>";

interface SendPassEmailParams {
  to: string;
  passId: string;
  passType: "night" | "weekend";
  customerName?: string;
}

export async function sendPassEmail({
  to,
  passId,
  passType,
  customerName,
}: SendPassEmailParams) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const passUrl = `${appUrl}/pass/${passId}`;
  const isNight = passType === "night";
  const passLabel = isNight ? "Night Pass" : "Weekend Pass";
  const duration = isNight ? "24 hours" : "48 hours";
  const clubAccess = isNight ? "2 clubs" : "all clubs (unlimited)";
  const greeting = customerName ? `Hi ${customerName},` : "Hi there,";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:8px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color:#1a7fc7;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:1px;">VOLUME</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Brussels Nightlife Pass</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#18181b;">
                ${greeting}
              </p>
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#18181b;">
                Your <strong>${passLabel}</strong> is confirmed and ready to use. Here are the details:
              </p>

              <!-- Pass Details Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e4e4e7;border-radius:6px;margin:24px 0;">
                <tr>
                  <td style="padding:24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:0 0 12px;font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">Pass Type</td>
                        <td style="padding:0 0 12px;font-size:15px;color:#18181b;font-weight:600;text-align:right;">${passLabel}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;border-top:1px solid #e4e4e7;">Duration</td>
                        <td style="padding:12px 0;font-size:15px;color:#18181b;font-weight:600;text-align:right;border-top:1px solid #e4e4e7;">${duration} from first scan</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0 0;font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;border-top:1px solid #e4e4e7;">Club Access</td>
                        <td style="padding:12px 0 0;font-size:15px;color:#18181b;font-weight:600;text-align:right;border-top:1px solid #e4e4e7;">${clubAccess}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;">
                <tr>
                  <td align="center">
                    <a href="${passUrl}" style="display:inline-block;background-color:#18181b;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:4px;text-transform:uppercase;letter-spacing:0.5px;">
                      View Your Pass
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Instructions -->
              <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#18181b;font-weight:600;">
                How to use your pass:
              </p>
              <ol style="margin:0 0 24px;padding-left:20px;font-size:14px;line-height:1.8;color:#3f3f46;">
                <li>Open the pass link above on your phone when you arrive at a club.</li>
                <li>Show the screen to the staff at the door.</li>
                <li>The staff will swipe to validate your entry.</li>
                <li>Your pass activates on the first scan and stays valid for ${duration}.</li>
              </ol>

              <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#71717a;">
                Museum access is also included -- visit the Atomium, Brussels Design Museum, and more.
              </p>

              <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#71717a;">
                Questions? Reply to this email and we will get back to you.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background-color:#fafafa;border-top:1px solid #e4e4e7;text-align:center;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;">
                VOLUME Brussels &mdash; Brussels Nightlife in One Pass
              </p>
              <p style="margin:8px 0 0;font-size:12px;color:#a1a1aa;">
                <a href="${appUrl}" style="color:#1a7fc7;text-decoration:none;">volumebrussels.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const resend = getResend();
  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Your Volume Brussels Pass is ready!",
    html,
  });

  if (result.error) {
    throw new Error(`Resend error: ${result.error.message}`);
  }

  return result.data;
}
