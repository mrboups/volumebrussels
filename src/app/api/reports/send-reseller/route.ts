import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getResend, FROM_EMAIL } from "@/lib/email";
import { isAdminRequest } from "@/lib/session";
import { parseTiers, resellerCommission } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { resellerId, half, year } = await req.json();

  const reseller = await db.reseller.findUnique({
    where: { id: resellerId },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!reseller) return NextResponse.json({ error: "Reseller not found" }, { status: 404 });

  const startMonth = half === 1 ? 0 : 6;
  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, startMonth + 6, 1);

  const passTiers = parseTiers(reseller.passCommissionTiers);
  const ticketTiers = parseTiers(reseller.ticketCommissionTiers);

  const [passes, tickets] = await Promise.all([
    db.pass.findMany({
      where: {
        resellerId,
        createdAt: { gte: startDate, lt: endDate },
        status: { not: "refunded" },
      },
      select: { price: true },
    }),
    db.ticket.findMany({
      where: {
        resellerId,
        createdAt: { gte: startDate, lt: endDate },
        status: { not: "refunded" },
      },
      select: { pricePaid: true },
    }),
  ]);

  const salesCount = passes.length + tickets.length;
  const salesAmount =
    passes.reduce((s, p) => s + p.price, 0) +
    tickets.reduce((s, t) => s + t.pricePaid, 0);
  const passCommission = passes.reduce(
    (s, p) => s + resellerCommission(p.price, passTiers),
    0
  );
  const ticketCommission = tickets.reduce(
    (s, t) => s + resellerCommission(t.pricePaid, ticketTiers),
    0
  );
  const commission = passCommission + ticketCommission;

  const halfLabel = half === 1 ? "January to June" : "July to December";
  const periodLabel = `H${half} ${year} — ${halfLabel}`;
  const eurFmt = new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" });
  const displayName = reseller.user.name || reseller.user.email;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background-color:#18181b;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:1px;">VOLUME</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Reseller Report</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#18181b;">
                Hi <strong>${displayName}</strong>,
              </p>
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#18181b;">
                Here is your half-year report for <strong>${periodLabel}</strong>.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e4e4e7;border-radius:6px;margin:24px 0;">
                <tr>
                  <td style="padding:24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:0 0 12px;font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">Total Sales</td>
                        <td style="padding:0 0 12px;font-size:15px;color:#18181b;font-weight:600;text-align:right;">${salesCount}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;border-top:1px solid #e4e4e7;">Total Sales Amount</td>
                        <td style="padding:12px 0;font-size:15px;color:#18181b;font-weight:600;text-align:right;border-top:1px solid #e4e4e7;">${eurFmt.format(salesAmount)}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;border-top:1px solid #e4e4e7;">Pass commission</td>
                        <td style="padding:12px 0;font-size:15px;color:#18181b;font-weight:600;text-align:right;border-top:1px solid #e4e4e7;">${eurFmt.format(passCommission)}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;border-top:1px solid #e4e4e7;">Ticket commission</td>
                        <td style="padding:12px 0;font-size:15px;color:#18181b;font-weight:600;text-align:right;border-top:1px solid #e4e4e7;">${eurFmt.format(ticketCommission)}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0 0;font-size:13px;color:#18181b;text-transform:uppercase;letter-spacing:0.5px;border-top:2px solid #18181b;font-weight:700;">Total commission due</td>
                        <td style="padding:12px 0 0;font-size:16px;color:#18181b;font-weight:800;text-align:right;border-top:2px solid #18181b;">${eurFmt.format(commission)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#71717a;">
                Please send your invoice to <strong>volumebrussels@gmail.com</strong>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;background-color:#fafafa;border-top:1px solid #e4e4e7;text-align:center;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;">VOLUME Brussels</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const resend = getResend();
    await resend.emails.send({
      from: FROM_EMAIL,
      to: reseller.user.email,
      subject: `VOLUME — Reseller Report ${periodLabel}`,
      html,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send" },
      { status: 500 }
    );
  }
}
