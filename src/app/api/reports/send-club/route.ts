import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getResend, FROM_EMAIL } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { clubId, quarter, year } = await req.json();

  const club = await db.club.findUnique({ where: { id: clubId } });
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });
  if (!club.contactEmail) return NextResponse.json({ error: "Club has no contact email" }, { status: 400 });

  const startMonth = (quarter - 1) * 3;
  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, startMonth + 3, 1);

  const visits = await db.passScan.count({
    where: {
      clubId,
      scannedAt: { gte: startDate, lt: endDate },
    },
  });

  const revenue = visits * club.payPerVisit;
  const quarterLabels: Record<number, string> = {
    1: "January to March",
    2: "April to June",
    3: "July to September",
    4: "October to December",
  };
  const periodLabel = `Q${quarter} ${year} — ${quarterLabels[quarter]}`;

  const eurFmt = new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" });

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
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Quarterly Report</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#18181b;">
                Hi <strong>${club.name}</strong>,
              </p>
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#18181b;">
                Here is your quarterly report for <strong>${periodLabel}</strong>.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e4e4e7;border-radius:6px;margin:24px 0;">
                <tr>
                  <td style="padding:24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:0 0 12px;font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">Total Visits</td>
                        <td style="padding:0 0 12px;font-size:15px;color:#18181b;font-weight:600;text-align:right;">${visits}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0 0;font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;border-top:1px solid #e4e4e7;">Total Revenue Due</td>
                        <td style="padding:12px 0 0;font-size:15px;color:#18181b;font-weight:600;text-align:right;border-top:1px solid #e4e4e7;">${eurFmt.format(revenue)}</td>
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
      to: club.contactEmail,
      subject: `VOLUME — Quarterly Report ${periodLabel}`,
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
