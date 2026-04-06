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
      instagramUrl: (formData.get("instagramUrl") as string) || null,
      facebookUrl: (formData.get("facebookUrl") as string) || null,
      websiteUrl: (formData.get("websiteUrl") as string) || null,
      isActive: formData.get("isActive") === "on",
      pictures: [],
    },
  });

  revalidatePath("/dashboard/admin");
  redirect("/dashboard/admin/clubs");
}

export async function updateClub(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const slug = (formData.get("slug") as string) || slugify(name);
  const openDays = splitTags(formData.get("openDays") as string || "");
  const musicTags = splitTags(formData.get("musicTags") as string || "");
  const dresscodeTags = splitTags(formData.get("dresscodeTags") as string || "");

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
      instagramUrl: (formData.get("instagramUrl") as string) || null,
      facebookUrl: (formData.get("facebookUrl") as string) || null,
      websiteUrl: (formData.get("websiteUrl") as string) || null,
      isActive: formData.get("isActive") === "on",
    },
  });

  revalidatePath("/dashboard/admin");
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
      pictures: [],
    },
  });

  revalidatePath("/dashboard/admin");
  redirect("/dashboard/admin/museums");
}

export async function updateMuseum(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const slug = (formData.get("slug") as string) || slugify(name);

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
    },
  });

  revalidatePath("/dashboard/admin");
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
