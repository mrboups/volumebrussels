"use server";

import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function updateSortOrder(id: string, type: "club" | "museum", order: number) {
  if (type === "club") {
    await db.club.update({ where: { id }, data: { sortOrder: order } });
  } else {
    await db.museum.update({ where: { id }, data: { sortOrder: order } });
  }
  revalidatePath("/dashboard/admin");
  revalidatePath("/offer");
  revalidatePath("/");
}

async function uniqueEventSlug(base: string): Promise<string> {
  let slug = base;
  let counter = 0;
  while (true) {
    const existing = await db.event.findUnique({ where: { slug } });
    if (!existing) return slug;
    counter++;
    slug = `${base}-${counter}`;
  }
}

function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// --------------- CLUBS ---------------

export async function createClub(formData: FormData) {
  const name = formData.get("name") as string;
  const slug = (formData.get("slug") as string) || slugify(name);
  const openDays = splitTags(formData.get("openDays") as string || "");
  const musicTags = splitTags(formData.get("musicTags") as string || "");
  const dresscodeTags = splitTags(formData.get("dresscodeTags") as string || "");

  await db.club.create({
    data: {
      name,
      slug,
      address: formData.get("address") as string,
      description: (formData.get("description") as string) || null,
      payPerVisit: parseFloat(formData.get("payPerVisit") as string) || 10,
      openDays: openDays as any,
      passInclusion: (formData.get("passInclusion") as any) || "both",
      musicTags,
      dresscodeTags,
      openTime: (formData.get("openTime") as string) || null,
      closeTime: (formData.get("closeTime") as string) || null,
      contactEmail: (formData.get("contactEmail") as string) || null,
      instagramUrl: (formData.get("instagramUrl") as string) || null,
      facebookUrl: (formData.get("facebookUrl") as string) || null,
      websiteUrl: (formData.get("websiteUrl") as string) || null,
      isActive: formData.get("isActive") === "on",
      pictures: (formData.get("picture") as string) ? [formData.get("picture") as string] : [],
    },
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/offer");
  revalidatePath("/");
  redirect("/dashboard/admin/clubs");
}

export async function updateClub(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const slug = (formData.get("slug") as string) || slugify(name);
  const openDays = splitTags(formData.get("openDays") as string || "");
  const musicTags = splitTags(formData.get("musicTags") as string || "");
  const dresscodeTags = splitTags(formData.get("dresscodeTags") as string || "");
  const picture = formData.get("picture") as string;

  await db.club.update({
    where: { id },
    data: {
      name,
      slug,
      address: formData.get("address") as string,
      description: (formData.get("description") as string) || null,
      payPerVisit: parseFloat(formData.get("payPerVisit") as string) || 10,
      openDays: openDays as any,
      passInclusion: (formData.get("passInclusion") as any) || "both",
      musicTags,
      dresscodeTags,
      openTime: (formData.get("openTime") as string) || null,
      closeTime: (formData.get("closeTime") as string) || null,
      contactEmail: (formData.get("contactEmail") as string) || null,
      instagramUrl: (formData.get("instagramUrl") as string) || null,
      facebookUrl: (formData.get("facebookUrl") as string) || null,
      websiteUrl: (formData.get("websiteUrl") as string) || null,
      isActive: formData.get("isActive") === "on",
      ...(picture ? { pictures: [picture] } : { pictures: [] }),
    },
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/offer");
  revalidatePath("/");
  redirect("/dashboard/admin/clubs");
}

export async function deleteClub(id: string) {
  await db.club.delete({ where: { id } });
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/clubs");
}

// --------------- MUSEUMS ---------------

export async function createMuseum(formData: FormData) {
  const name = formData.get("name") as string;
  const slug = (formData.get("slug") as string) || slugify(name);

  await db.museum.create({
    data: {
      name,
      slug,
      address: formData.get("address") as string,
      description: (formData.get("description") as string) || null,
      websiteUrl: (formData.get("websiteUrl") as string) || null,
      payPerVisit: parseFloat(formData.get("payPerVisit") as string) || 8,
      isActive: formData.get("isActive") === "on",
      pictures: (formData.get("picture") as string) ? [formData.get("picture") as string] : [],
    },
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/offer");
  revalidatePath("/");
  redirect("/dashboard/admin/museums");
}

export async function updateMuseum(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const slug = (formData.get("slug") as string) || slugify(name);
  const picture = formData.get("picture") as string;

  await db.museum.update({
    where: { id },
    data: {
      name,
      slug,
      address: formData.get("address") as string,
      description: (formData.get("description") as string) || null,
      websiteUrl: (formData.get("websiteUrl") as string) || null,
      payPerVisit: parseFloat(formData.get("payPerVisit") as string) || 8,
      isActive: formData.get("isActive") === "on",
      ...(picture ? { pictures: [picture] } : { pictures: [] }),
    },
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/offer");
  revalidatePath("/");
  redirect("/dashboard/admin/museums");
}

export async function deleteMuseum(id: string) {
  await db.museum.delete({ where: { id } });
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/museums");
}

// --------------- EVENTS ---------------

interface PricingPhaseInput {
  name: string;
  price: number;
  startDate: string;
  endDate: string;
}

export async function createEvent(formData: FormData) {
  const name = formData.get("name") as string;
  const baseSlug = (formData.get("slug") as string) || slugify(name);
  const slug = await uniqueEventSlug(baseSlug);
  const phasesJson = formData.get("pricingPhases") as string;
  const phases: PricingPhaseInput[] = phasesJson ? JSON.parse(phasesJson) : [];

  const clubId = formData.get("clubId") as string;

  await db.$transaction(async (tx) => {
    const event = await tx.event.create({
      data: {
        name,
        slug,
        description: (formData.get("description") as string) || null,
        coverImage: (formData.get("coverImage") as string) || null,
        venueName: (formData.get("venueName") as string) || null,
        venueAddress: (formData.get("venueAddress") as string) || null,
        date: new Date(formData.get("date") as string),
        clubId: clubId || null,
        isLinkedToPass: formData.get("isLinkedToPass") === "on",
        isActive: formData.get("isActive") === "on",
      },
    });

    if (phases.length > 0) {
      await tx.pricingPhase.createMany({
        data: phases.map((p) => ({
          eventId: event.id,
          name: p.name as any,
          price: p.price,
          startDate: new Date(p.startDate),
          endDate: new Date(p.endDate),
        })),
      });
    }
  });

  revalidatePath("/dashboard/admin");
  redirect("/dashboard/admin/events");
}

export async function updateEvent(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const slug = (formData.get("slug") as string) || slugify(name);
  const phasesJson = formData.get("pricingPhases") as string;
  const phases: PricingPhaseInput[] = phasesJson ? JSON.parse(phasesJson) : [];

  const clubId = formData.get("clubId") as string;

  await db.$transaction(async (tx) => {
    await tx.event.update({
      where: { id },
      data: {
        name,
        slug,
        description: (formData.get("description") as string) || null,
        coverImage: (formData.get("coverImage") as string) || null,
        venueName: (formData.get("venueName") as string) || null,
        venueAddress: (formData.get("venueAddress") as string) || null,
        date: new Date(formData.get("date") as string),
        clubId: clubId || null,
        isLinkedToPass: formData.get("isLinkedToPass") === "on",
        isActive: formData.get("isActive") === "on",
      },
    });

    // Remove old phases and recreate
    await tx.pricingPhase.deleteMany({ where: { eventId: id } });

    if (phases.length > 0) {
      await tx.pricingPhase.createMany({
        data: phases.map((p) => ({
          eventId: id,
          name: p.name as any,
          price: p.price,
          startDate: new Date(p.startDate),
          endDate: new Date(p.endDate),
        })),
      });
    }
  });

  revalidatePath("/dashboard/admin");
  redirect("/dashboard/admin/events");
}

export async function deleteEvent(id: string) {
  await db.$transaction(async (tx) => {
    await tx.pricingPhase.deleteMany({ where: { eventId: id } });
    await tx.event.delete({ where: { id } });
  });
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/events");
}

// --------------- ARTICLES ---------------

export async function createArticle(formData: FormData) {
  const title = formData.get("title") as string;
  const slug = slugify(title);

  await db.article.create({
    data: {
      title,
      slug,
      summary: (formData.get("summary") as string) || "",
      content: (formData.get("content") as string) || "",
      coverImage: (formData.get("coverImage") as string) || null,
      isPublished: formData.get("isPublished") === "on",
      sortOrder: parseInt(formData.get("sortOrder") as string) || 0,
    },
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/articles");
  revalidatePath("/");
  redirect("/dashboard/admin/articles");
}

export async function updateArticle(id: string, formData: FormData) {
  const title = formData.get("title") as string;
  const slug = slugify(title);

  await db.article.update({
    where: { id },
    data: {
      title,
      slug,
      summary: (formData.get("summary") as string) || "",
      content: (formData.get("content") as string) || "",
      coverImage: (formData.get("coverImage") as string) || null,
      isPublished: formData.get("isPublished") === "on",
      sortOrder: parseInt(formData.get("sortOrder") as string) || 0,
    },
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/articles");
  revalidatePath("/");
  redirect("/dashboard/admin/articles");
}

export async function deleteArticle(id: string) {
  await db.article.delete({ where: { id } });
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/articles");
  revalidatePath("/");
}

// --------------- RESELLERS ---------------

export async function createReseller(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const commissionRate = parseFloat(formData.get("commissionRate") as string) || 0.08;
  const isActive = formData.get("isActive") === "on";

  await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        name,
        role: "reseller",
      },
    });
    await tx.reseller.create({
      data: {
        userId: user.id,
        commissionRate,
        isActive,
      },
    });
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/resellers");
  redirect("/dashboard/admin/resellers");
}

export async function updateReseller(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const commissionRate = parseFloat(formData.get("commissionRate") as string) || 0.08;
  const isActive = formData.get("isActive") === "on";

  const reseller = await db.reseller.findUnique({ where: { id }, include: { user: true } });
  if (!reseller) throw new Error("Reseller not found");

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: reseller.userId },
      data: { name, email },
    });
    await tx.reseller.update({
      where: { id },
      data: { commissionRate, isActive },
    });
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/resellers");
  redirect("/dashboard/admin/resellers");
}

export async function deleteReseller(id: string) {
  const reseller = await db.reseller.findUnique({ where: { id } });
  if (!reseller) return;
  await db.$transaction(async (tx) => {
    await tx.reseller.delete({ where: { id } });
    await tx.user.delete({ where: { id: reseller.userId } });
  });
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/resellers");
}

// --------------- REPORTS ---------------

export async function sendClubReport(clubId: string, quarter: number, year: number) {
  const club = await db.club.findUnique({ where: { id: clubId } });
  if (!club) return { error: "Club not found" };
  if (!club.contactEmail) return { error: "Club has no contact email" };

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

  const { getResend, FROM_EMAIL } = await import("@/lib/email");
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
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to send" };
  }
}

export async function sendResellerReport(resellerId: string, half: number, year: number) {
  const reseller = await db.reseller.findUnique({
    where: { id: resellerId },
    include: { user: true },
  });
  if (!reseller) return { error: "Reseller not found" };

  const startMonth = half === 1 ? 0 : 6;
  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, startMonth + 6, 1);

  const passes = await db.pass.findMany({
    where: {
      resellerId,
      createdAt: { gte: startDate, lt: endDate },
    },
  });

  const salesCount = passes.length;
  const salesAmount = passes.reduce((sum, p) => sum + p.price, 0);
  const commission = salesAmount * reseller.commissionRate;

  const halfLabel = half === 1 ? "January to June" : "July to December";
  const periodLabel = `H${half} ${year} — ${halfLabel}`;

  const { getResend, FROM_EMAIL } = await import("@/lib/email");
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
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Reseller Report</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#18181b;">
                Hi <strong>${reseller.user.name || reseller.user.email}</strong>,
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
                        <td style="padding:12px 0 0;font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;border-top:1px solid #e4e4e7;">Commission Due (${(reseller.commissionRate * 100).toFixed(0)}%)</td>
                        <td style="padding:12px 0 0;font-size:15px;color:#18181b;font-weight:600;text-align:right;border-top:1px solid #e4e4e7;">${eurFmt.format(commission)}</td>
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
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to send" };
  }
}

// --------------- PASS EMAIL ---------------

export async function resendPassEmail(passId: string) {
  const pass = await db.pass.findUnique({
    where: { id: passId },
    include: { user: true },
  });
  if (!pass) return { error: "Pass not found" };

  try {
    const { sendPassEmail } = await import("@/lib/email");
    await sendPassEmail({
      to: pass.user.email,
      passId: pass.id,
      passType: pass.type as "night" | "weekend",
      customerName: pass.user.name || undefined,
    });
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to send" };
  }
}

export async function updatePassEmail(passId: string, newEmail: string) {
  const pass = await db.pass.findUnique({
    where: { id: passId },
    include: { user: true },
  });
  if (!pass) return { error: "Pass not found" };

  // Update user email
  await db.user.update({
    where: { id: pass.userId },
    data: { email: newEmail },
  });

  // Resend email to new address
  try {
    const { sendPassEmail } = await import("@/lib/email");
    await sendPassEmail({
      to: newEmail,
      passId: pass.id,
      passType: pass.type as "night" | "weekend",
      customerName: pass.user.name || undefined,
    });
    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to send" };
  }
}
