"use server";

import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { parseBrusselsDatetimeLocal } from "@/lib/tz";
import { requireAdmin } from "@/lib/session";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function updateSortOrder(id: string, type: "club" | "museum", order: number) {
  await requireAdmin();
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
  await requireAdmin();
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
  await requireAdmin();
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
  await requireAdmin();
  await db.club.delete({ where: { id } });
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/clubs");
}

// --------------- MUSEUMS ---------------

export async function createMuseum(formData: FormData) {
  await requireAdmin();
  const name = formData.get("name") as string;
  const slug = (formData.get("slug") as string) || slugify(name);
  const openDays = splitTags(formData.get("openDays") as string || "");

  await db.museum.create({
    data: {
      name,
      slug,
      address: formData.get("address") as string,
      description: (formData.get("description") as string) || null,
      websiteUrl: (formData.get("websiteUrl") as string) || null,
      payPerVisit: parseFloat(formData.get("payPerVisit") as string) || 8,
      openDays: openDays as any,
      openTime: (formData.get("openTime") as string) || null,
      closeTime: (formData.get("closeTime") as string) || null,
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
  await requireAdmin();
  const name = formData.get("name") as string;
  const slug = (formData.get("slug") as string) || slugify(name);
  const picture = formData.get("picture") as string;
  const openDays = splitTags(formData.get("openDays") as string || "");

  await db.museum.update({
    where: { id },
    data: {
      name,
      slug,
      address: formData.get("address") as string,
      description: (formData.get("description") as string) || null,
      websiteUrl: (formData.get("websiteUrl") as string) || null,
      payPerVisit: parseFloat(formData.get("payPerVisit") as string) || 8,
      openDays: openDays as any,
      openTime: (formData.get("openTime") as string) || null,
      closeTime: (formData.get("closeTime") as string) || null,
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
  await requireAdmin();
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

function parseOptionalFloat(raw: FormDataEntryValue | null): number | null {
  if (typeof raw !== "string" || raw.trim() === "") return null;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : null;
}

export async function createEvent(formData: FormData) {
  await requireAdmin();
  const name = formData.get("name") as string;
  const baseSlug = (formData.get("slug") as string) || slugify(name);
  const slug = await uniqueEventSlug(baseSlug);
  const phasesJson = formData.get("pricingPhases") as string;
  const phases: PricingPhaseInput[] = phasesJson ? JSON.parse(phasesJson) : [];

  const clubId = formData.get("clubId") as string;
  const clubTicketFee = parseOptionalFloat(formData.get("clubTicketFee"));

  await db.$transaction(async (tx) => {
    const event = await tx.event.create({
      data: {
        name,
        slug,
        description: (formData.get("description") as string) || null,
        coverImage: (formData.get("coverImage") as string) || null,
        venueName: (formData.get("venueName") as string) || null,
        venueAddress: (formData.get("venueAddress") as string) || null,
        date: parseBrusselsDatetimeLocal(formData.get("date") as string),
        clubId: clubId || null,
        isLinkedToPass: formData.get("isLinkedToPass") === "on",
        isActive: formData.get("isActive") === "on",
        clubTicketFee,
      },
    });

    if (phases.length > 0) {
      await tx.pricingPhase.createMany({
        data: phases.map((p) => ({
          eventId: event.id,
          name: p.name as any,
          price: p.price,
          startDate: parseBrusselsDatetimeLocal(p.startDate),
          endDate: parseBrusselsDatetimeLocal(p.endDate),
        })),
      });
    }
  });

  revalidatePath("/dashboard/admin");
  redirect("/dashboard/admin/events");
}

export async function updateEvent(id: string, formData: FormData) {
  await requireAdmin();
  const name = formData.get("name") as string;
  const slug = (formData.get("slug") as string) || slugify(name);
  const phasesJson = formData.get("pricingPhases") as string;
  const phases: PricingPhaseInput[] = phasesJson ? JSON.parse(phasesJson) : [];

  const clubId = formData.get("clubId") as string;
  const clubTicketFee = parseOptionalFloat(formData.get("clubTicketFee"));

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
        date: parseBrusselsDatetimeLocal(formData.get("date") as string),
        clubId: clubId || null,
        isLinkedToPass: formData.get("isLinkedToPass") === "on",
        isActive: formData.get("isActive") === "on",
        clubTicketFee,
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
          startDate: parseBrusselsDatetimeLocal(p.startDate),
          endDate: parseBrusselsDatetimeLocal(p.endDate),
        })),
      });
    }
  });

  revalidatePath("/dashboard/admin");
  redirect("/dashboard/admin/events");
}

export async function deleteEvent(id: string) {
  await requireAdmin();
  // Check if event has tickets — never delete an event with tickets
  const ticketCount = await db.ticket.count({ where: { eventId: id } });

  if (ticketCount > 0) {
    // Soft delete: mark as inactive + sales ended (keeps ticket history intact)
    await db.event.update({
      where: { id },
      data: { isActive: false, salesEnded: true },
    });
  } else {
    // Hard delete: no tickets, safe to remove event + pricing phases
    await db.$transaction(async (tx) => {
      await tx.pricingPhase.deleteMany({ where: { eventId: id } });
      await tx.event.delete({ where: { id } });
    });
  }
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/events");
}

export async function toggleEventSales(id: string) {
  await requireAdmin();
  const event = await db.event.findUnique({ where: { id } });
  if (!event) return;
  await db.event.update({
    where: { id },
    data: { salesEnded: !event.salesEnded },
  });
  revalidatePath("/dashboard/admin/events");
  revalidatePath(`/tickets/${event.slug}`);
}

// --------------- ARTICLES ---------------

export async function createArticle(formData: FormData) {
  await requireAdmin();
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
  await requireAdmin();
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
  await requireAdmin();
  await db.article.delete({ where: { id } });
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/articles");
  revalidatePath("/");
}

// --------------- RESELLERS ---------------

function parseTierJson(raw: FormDataEntryValue | null): unknown {
  if (typeof raw !== "string" || !raw) {
    return [{ upTo: null, rate: 0.08 }];
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // fall through
  }
  return [{ upTo: null, rate: 0.08 }];
}

export async function createReseller(formData: FormData) {
  await requireAdmin();
  const name = formData.get("name") as string;
  const email = (formData.get("email") as string).trim().toLowerCase();
  const passCommissionTiers = parseTierJson(formData.get("passCommissionTiers"));
  const ticketCommissionTiers = parseTierJson(formData.get("ticketCommissionTiers"));
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
        passCommissionTiers: passCommissionTiers as never,
        ticketCommissionTiers: ticketCommissionTiers as never,
        isActive,
      },
    });
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/resellers");
  redirect("/dashboard/admin/resellers");
}

export async function updateReseller(id: string, formData: FormData) {
  await requireAdmin();
  const name = formData.get("name") as string;
  const email = (formData.get("email") as string).trim().toLowerCase();
  const passCommissionTiers = parseTierJson(formData.get("passCommissionTiers"));
  const ticketCommissionTiers = parseTierJson(formData.get("ticketCommissionTiers"));
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
      data: {
        passCommissionTiers: passCommissionTiers as never,
        ticketCommissionTiers: ticketCommissionTiers as never,
        isActive,
      },
    });
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/resellers");
  redirect("/dashboard/admin/resellers");
}

export async function deleteReseller(id: string) {
  await requireAdmin();
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
  await requireAdmin();
  const club = await db.club.findUnique({ where: { id: clubId } });
  if (!club) return { error: "Club not found" };
  if (!club.contactEmail) return { error: "Club has no contact email" };

  const startMonth = (quarter - 1) * 3;
  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, startMonth + 3, 1);

  const { computeClubTicketFee } = await import("@/lib/pricing");

  const [visits, quarterTickets] = await Promise.all([
    db.passScan.count({
      where: {
        clubId,
        scannedAt: { gte: startDate, lt: endDate },
      },
    }),
    db.ticket.findMany({
      where: {
        validatedAt: { gte: startDate, lt: endDate, not: null },
        event: { clubId },
      },
      select: {
        pricePaid: true,
        event: { select: { clubTicketFee: true } },
      },
    }),
  ]);

  const ticketCount = quarterTickets.length;
  const ticketRevenue = quarterTickets.reduce(
    (sum, t) => sum + computeClubTicketFee(t.pricePaid, t.event),
    0
  );

  const passRevenue = visits * club.payPerVisit;
  const revenue = passRevenue + ticketRevenue;
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
                        <td style="padding:0 0 12px;font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">Pass Visits</td>
                        <td style="padding:0 0 12px;font-size:15px;color:#18181b;font-weight:600;text-align:right;">${visits}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;border-top:1px solid #e4e4e7;">Pass Revenue</td>
                        <td style="padding:12px 0;font-size:15px;color:#18181b;font-weight:600;text-align:right;border-top:1px solid #e4e4e7;">${eurFmt.format(passRevenue)}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;border-top:1px solid #e4e4e7;">Validated Tickets</td>
                        <td style="padding:12px 0;font-size:15px;color:#18181b;font-weight:600;text-align:right;border-top:1px solid #e4e4e7;">${ticketCount}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;border-top:1px solid #e4e4e7;">Ticket Revenue</td>
                        <td style="padding:12px 0;font-size:15px;color:#18181b;font-weight:600;text-align:right;border-top:1px solid #e4e4e7;">${eurFmt.format(ticketRevenue)}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0 0;font-size:13px;color:#18181b;text-transform:uppercase;letter-spacing:0.5px;border-top:2px solid #18181b;font-weight:700;">Total Revenue Due</td>
                        <td style="padding:12px 0 0;font-size:16px;color:#18181b;font-weight:800;text-align:right;border-top:2px solid #18181b;">${eurFmt.format(revenue)}</td>
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
  await requireAdmin();
  const reseller = await db.reseller.findUnique({
    where: { id: resellerId },
    include: { user: true },
  });
  if (!reseller) return { error: "Reseller not found" };

  const startMonth = half === 1 ? 0 : 6;
  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, startMonth + 6, 1);

  const { parseTiers, resellerCommission } = await import("@/lib/pricing");
  const passTiers = parseTiers(reseller.passCommissionTiers);
  const ticketTiers = parseTiers(reseller.ticketCommissionTiers);

  const [passes, tickets] = await Promise.all([
    db.pass.findMany({
      where: {
        resellerId,
        createdAt: { gte: startDate, lt: endDate },
        // Refunded sales are reversed — no commission owed on them.
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

  const passSalesCount = passes.length;
  const passSalesAmount = passes.reduce((sum, p) => sum + p.price, 0);
  const passCommission = passes.reduce(
    (sum, p) => sum + resellerCommission(p.price, passTiers),
    0
  );
  const ticketSalesCount = tickets.length;
  const ticketSalesAmount = tickets.reduce((sum, t) => sum + t.pricePaid, 0);
  const ticketCommission = tickets.reduce(
    (sum, t) => sum + resellerCommission(t.pricePaid, ticketTiers),
    0
  );

  const salesCount = passSalesCount + ticketSalesCount;
  const salesAmount = passSalesAmount + ticketSalesAmount;
  const commission = passCommission + ticketCommission;

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
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to send" };
  }
}

// --------------- PASS EMAIL ---------------

export async function resendPassEmail(passId: string) {
  await requireAdmin();
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
  await requireAdmin();
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

// --------------- TICKET EMAIL ---------------

export async function resendTicketEmail(ticketId: string) {
  await requireAdmin();
  const ticket = await db.ticket.findUnique({
    where: { id: ticketId },
    include: { user: true, event: true },
  });
  if (!ticket) return { error: "Ticket not found" };
  try {
    const { sendTicketEmail } = await import("@/lib/email");
    await sendTicketEmail({
      to: ticket.user.email,
      ticketId: ticket.id,
      eventName: ticket.event.name,
      eventDate: ticket.event.date,
      venueName: ticket.event.venueName || undefined,
      price: ticket.pricePaid,
      customerName: ticket.user.name || undefined,
    });
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to send" };
  }
}

export async function updateTicketEmail(ticketId: string, newEmail: string) {
  await requireAdmin();
  const ticket = await db.ticket.findUnique({
    where: { id: ticketId },
    include: { user: true, event: true },
  });
  if (!ticket) return { error: "Ticket not found" };
  await db.user.update({
    where: { id: ticket.userId },
    data: { email: newEmail },
  });
  try {
    const { sendTicketEmail } = await import("@/lib/email");
    await sendTicketEmail({
      to: newEmail,
      ticketId: ticket.id,
      eventName: ticket.event.name,
      eventDate: ticket.event.date,
      venueName: ticket.event.venueName || undefined,
      price: ticket.pricePaid,
      customerName: ticket.user.name || undefined,
    });
    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to send" };
  }
}

// --------------- UNDO CHECK-INS ---------------

/**
 * Undo a pass scan at a club or museum.
 *
 * - Refuses if the pass is refunded.
 * - Deletes the scan row.
 * - If the undone scan was a CLUB scan and no other club scans remain on
 *   the pass, reverts the activation: clears `activatedAt` / `expiresAt`
 *   and sets status back to `purchased`. That way a night pass whose
 *   only scan is undone is genuinely fresh again, and its 2-club limit
 *   is based on remaining scans.
 * - Museum scans never activate a pass, so a museum-scan undo is a
 *   straight delete.
 */
export async function undoPassScan(scanId: string) {
  await requireAdmin();

  const scan = await db.passScan.findUnique({
    where: { id: scanId },
    include: { pass: true },
  });
  if (!scan) return { error: "Scan not found" };
  if (scan.pass.status === "refunded") {
    return { error: "Pass is refunded — undo not allowed" };
  }

  const wasClubScan = scan.clubId !== null;

  await db.$transaction(async (tx) => {
    await tx.passScan.delete({ where: { id: scanId } });

    if (wasClubScan) {
      const remainingClubScans = await tx.passScan.count({
        where: { passId: scan.passId, clubId: { not: null } },
      });
      if (remainingClubScans === 0) {
        // No more club scans → pass is effectively unused, revert activation.
        await tx.pass.update({
          where: { id: scan.passId },
          data: {
            activatedAt: null,
            expiresAt: null,
            status: "purchased",
          },
        });
      }
    }
  });

  console.log(
    `[audit] undoPassScan scanId=${scanId} passId=${scan.passId} clubId=${scan.clubId} museumId=${scan.museumId} scannedAt=${scan.scannedAt.toISOString()}`
  );

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/passes");
  revalidatePath("/dashboard/users");
  revalidatePath(`/pass/${scan.passId}`);
  return { success: true };
}

/**
 * Undo a ticket validation — clears `validatedAt` and moves the ticket
 * back from `used` to `purchased`. Refunded tickets can't be undone.
 */
export async function undoTicketValidation(ticketId: string) {
  await requireAdmin();

  const ticket = await db.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) return { error: "Ticket not found" };
  if (ticket.status === "refunded") {
    return { error: "Ticket is refunded — undo not allowed" };
  }
  if (ticket.validatedAt === null && ticket.status !== "used") {
    return { error: "Ticket is not validated" };
  }

  await db.ticket.update({
    where: { id: ticketId },
    data: {
      validatedAt: null,
      status: "purchased",
    },
  });

  console.log(
    `[audit] undoTicketValidation ticketId=${ticketId} previousValidatedAt=${ticket.validatedAt?.toISOString() ?? "null"}`
  );

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/tickets");
  revalidatePath("/dashboard/users");
  revalidatePath(`/ticket/${ticketId}`);
  return { success: true };
}

// --------------- REFUNDS ---------------

/** Returns true if a stripePaymentId refers to an actual Stripe charge. */
function isRealStripePayment(stripePaymentId: string | null): boolean {
  return !!stripePaymentId && stripePaymentId.startsWith("pi_");
}

/**
 * Refund a pass.
 *
 * - Refuses if already refunded.
 * - If the pass was paid via Stripe (stripePaymentId starts with `pi_`),
 *   issues a partial refund for the pass's price against that PaymentIntent.
 *   Multi-pass purchases share one PaymentIntent, so this refunds only the
 *   portion attributable to this pass. Stripe tracks the remaining
 *   refundable amount automatically.
 * - Otherwise (guest / giveaway / legacy) no Stripe call — local mark only.
 * - On success, sets pass.status = "refunded" and sends a refund email to
 *   the customer (paid passes only).
 * - If the Stripe refund fails, the DB is NOT touched.
 */
export async function refundPass(passId: string) {
  await requireAdmin();

  const pass = await db.pass.findUnique({
    where: { id: passId },
    include: { user: true },
  });
  if (!pass) return { error: "Pass not found" };
  if (pass.status === "refunded") return { error: "Pass already refunded" };

  const stripeRefundable = isRealStripePayment(pass.stripePaymentId);

  // Stripe first, DB second.
  if (stripeRefundable && pass.price > 0) {
    try {
      const { getStripe } = await import("@/lib/stripe");
      const stripe = getStripe();
      await stripe.refunds.create({
        payment_intent: pass.stripePaymentId!,
        amount: Math.round(pass.price * 100),
      });
    } catch (err) {
      return {
        error:
          err instanceof Error
            ? `Stripe refund failed: ${err.message}`
            : "Stripe refund failed",
      };
    }
  }

  await db.pass.update({
    where: { id: passId },
    data: { status: "refunded" },
  });

  // Notify customer only if they actually paid money.
  if (stripeRefundable && pass.price > 0) {
    try {
      const { sendRefundEmail } = await import("@/lib/email");
      await sendRefundEmail({
        to: pass.user.email,
        itemType: "pass",
        itemLabel: pass.type === "night" ? "Night Pass" : "Weekend Pass",
        amount: pass.price,
        customerName: pass.user.name || undefined,
      });
    } catch (err) {
      // Don't fail the refund if email fails; log and continue.
      console.error("[refundPass] email send failed:", err);
    }
  }

  console.log(
    `[audit] refundPass passId=${passId} price=${pass.price} stripePaymentId=${pass.stripePaymentId}`
  );

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/passes");
  revalidatePath("/dashboard/users");
  revalidatePath(`/dashboard/admin/passes/${passId}`);
  revalidatePath(`/pass/${passId}`);
  return { success: true, stripeRefundable };
}

/**
 * Refund a ticket. Same pattern as refundPass.
 */
export async function refundTicket(ticketId: string) {
  await requireAdmin();

  const ticket = await db.ticket.findUnique({
    where: { id: ticketId },
    include: { user: true, event: true },
  });
  if (!ticket) return { error: "Ticket not found" };
  if (ticket.status === "refunded") return { error: "Ticket already refunded" };

  const stripeRefundable = isRealStripePayment(ticket.stripePaymentId);

  if (stripeRefundable && ticket.pricePaid > 0) {
    try {
      const { getStripe } = await import("@/lib/stripe");
      const stripe = getStripe();
      await stripe.refunds.create({
        payment_intent: ticket.stripePaymentId!,
        amount: Math.round(ticket.pricePaid * 100),
      });
    } catch (err) {
      return {
        error:
          err instanceof Error
            ? `Stripe refund failed: ${err.message}`
            : "Stripe refund failed",
      };
    }
  }

  await db.ticket.update({
    where: { id: ticketId },
    data: { status: "refunded" },
  });

  if (stripeRefundable && ticket.pricePaid > 0) {
    try {
      const { sendRefundEmail } = await import("@/lib/email");
      await sendRefundEmail({
        to: ticket.user.email,
        itemType: "ticket",
        itemLabel: ticket.event.name,
        amount: ticket.pricePaid,
        customerName: ticket.user.name || undefined,
      });
    } catch (err) {
      console.error("[refundTicket] email send failed:", err);
    }
  }

  console.log(
    `[audit] refundTicket ticketId=${ticketId} pricePaid=${ticket.pricePaid} stripePaymentId=${ticket.stripePaymentId}`
  );

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/tickets");
  revalidatePath("/dashboard/users");
  revalidatePath(`/ticket/${ticketId}`);
  return { success: true, stripeRefundable };
}

// --------------- GUEST PASS ---------------

export async function createGuestPass(formData: FormData) {
  await requireAdmin();
  const rawEmail = (formData.get("email") as string | null)?.trim().toLowerCase();
  const type = formData.get("type") as "night" | "weekend" | null;

  if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
    return { error: "Invalid email address" };
  }
  if (type !== "night" && type !== "weekend") {
    return { error: "Invalid pass type" };
  }

  // Find or create the user by email
  const user = await db.user.upsert({
    where: { email: rawEmail },
    update: {},
    create: { email: rawEmail, role: "customer" },
  });

  // Create the free pass. Marked with a stripePaymentId prefix so we can
  // distinguish guest/invitation passes from paid ones.
  const pass = await db.pass.create({
    data: {
      type,
      price: 0,
      userId: user.id,
      status: "purchased",
      stripePaymentId: `guest_${Date.now()}`,
    },
  });

  try {
    const { sendPassEmail } = await import("@/lib/email");
    await sendPassEmail({
      to: rawEmail,
      passId: pass.id,
      passType: type,
      customerName: user.name || undefined,
      isGuest: true,
    });
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? `Pass created but email failed: ${err.message}`
          : "Pass created but email failed",
    };
  }

  revalidatePath("/dashboard/admin");
  return { success: true, passId: pass.id };
}

// --------------- GIVEAWAY FORMS ---------------

async function uniqueFormSlug(base: string, excludeId?: string): Promise<string> {
  let slug = base;
  let counter = 0;
  while (true) {
    const existing = await db.giveawayForm.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    counter++;
    slug = `${base}-${counter}`;
  }
}

function formDataToGiveawayInput(formData: FormData) {
  const slugRaw = ((formData.get("slug") as string) || "").trim();
  const passType = formData.get("passType") as "night" | "weekend";
  const isActive = formData.get("isActive") === "on";

  return {
    slugRaw,
    passType,
    isActive,
    titleEn: ((formData.get("titleEn") as string) || "").trim(),
    descriptionEn: ((formData.get("descriptionEn") as string) || "").trim() || null,
    successMessageEn:
      ((formData.get("successMessageEn") as string) || "").trim() || null,
    titleFr: ((formData.get("titleFr") as string) || "").trim() || null,
    descriptionFr: ((formData.get("descriptionFr") as string) || "").trim() || null,
    successMessageFr:
      ((formData.get("successMessageFr") as string) || "").trim() || null,
    titleNl: ((formData.get("titleNl") as string) || "").trim() || null,
    descriptionNl: ((formData.get("descriptionNl") as string) || "").trim() || null,
    successMessageNl:
      ((formData.get("successMessageNl") as string) || "").trim() || null,
  };
}

export async function createGiveawayForm(formData: FormData) {
  await requireAdmin();
  const input = formDataToGiveawayInput(formData);

  if (!input.titleEn) {
    throw new Error("English title is required");
  }
  if (input.passType !== "night" && input.passType !== "weekend") {
    throw new Error("Pass type is required");
  }

  const base = slugify(input.slugRaw || input.titleEn);
  const slug = await uniqueFormSlug(base);

  await db.giveawayForm.create({
    data: {
      slug,
      passType: input.passType,
      isActive: input.isActive,
      titleEn: input.titleEn,
      descriptionEn: input.descriptionEn,
      successMessageEn: input.successMessageEn,
      titleFr: input.titleFr,
      descriptionFr: input.descriptionFr,
      successMessageFr: input.successMessageFr,
      titleNl: input.titleNl,
      descriptionNl: input.descriptionNl,
      successMessageNl: input.successMessageNl,
    },
  });

  revalidatePath("/dashboard/admin/giveaways");
  revalidatePath("/dashboard/admin");
  redirect("/dashboard/admin/giveaways");
}

export async function updateGiveawayForm(id: string, formData: FormData) {
  await requireAdmin();
  const input = formDataToGiveawayInput(formData);

  if (!input.titleEn) {
    throw new Error("English title is required");
  }

  const base = slugify(input.slugRaw || input.titleEn);
  const slug = await uniqueFormSlug(base, id);

  await db.giveawayForm.update({
    where: { id },
    data: {
      slug,
      passType: input.passType,
      isActive: input.isActive,
      titleEn: input.titleEn,
      descriptionEn: input.descriptionEn,
      successMessageEn: input.successMessageEn,
      titleFr: input.titleFr,
      descriptionFr: input.descriptionFr,
      successMessageFr: input.successMessageFr,
      titleNl: input.titleNl,
      descriptionNl: input.descriptionNl,
      successMessageNl: input.successMessageNl,
    },
  });

  revalidatePath("/dashboard/admin/giveaways");
  revalidatePath(`/giveaway/${slug}`);
  redirect("/dashboard/admin/giveaways");
}

export async function toggleGiveawayForm(id: string) {
  await requireAdmin();
  const form = await db.giveawayForm.findUnique({ where: { id } });
  if (!form) return { error: "Form not found" };
  await db.giveawayForm.update({
    where: { id },
    data: { isActive: !form.isActive },
  });
  revalidatePath("/dashboard/admin/giveaways");
  revalidatePath(`/giveaway/${form.slug}`);
  return { success: true };
}

export async function deleteGiveawayForm(id: string) {
  await requireAdmin();
  // Detach passes that reference this form so the history survives.
  await db.pass.updateMany({
    where: { formId: id },
    data: { formId: null },
  });
  await db.giveawayForm.delete({ where: { id } });
  revalidatePath("/dashboard/admin/giveaways");
}

// Public submission: creates the free pass and emails it.
// Returns error codes (not raw messages) so the client can render
// localized copy per giveaway language.
export async function submitGiveawayForm(
  slug: string,
  data: { name: string; email: string }
) {
  const form = await db.giveawayForm.findUnique({ where: { slug } });
  if (!form) return { error: "not_found" };
  if (!form.isActive) return { error: "inactive" };

  const email = data.email.trim().toLowerCase();
  const name = data.name.trim();

  if (!name) return { error: "missing_name" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "invalid_email" };
  }

  // Find or create the user. If they already have a name, don't overwrite.
  const user = await db.user.upsert({
    where: { email },
    update: { name: { set: name } },
    create: { email, name, role: "customer" },
  });

  // One free pass per user per giveaway. Different giveaways are still fine.
  const existing = await db.pass.findFirst({
    where: { userId: user.id, formId: form.id },
    select: { id: true },
  });
  if (existing) {
    return { error: "already_claimed" };
  }

  const pass = await db.pass.create({
    data: {
      type: form.passType,
      price: 0,
      userId: user.id,
      status: "purchased",
      formId: form.id,
      stripePaymentId: `giveaway_${form.slug}_${Date.now()}`,
    },
  });

  try {
    const { sendPassEmail } = await import("@/lib/email");
    await sendPassEmail({
      to: email,
      passId: pass.id,
      passType: form.passType as "night" | "weekend",
      customerName: name,
      isGuest: true,
    });
  } catch (err) {
    console.error("Giveaway email send failed:", err);
    return { error: "email_failed" };
  }

  return { success: true, passId: pass.id };
}
