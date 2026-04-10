import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import GiveawayClient from "./GiveawayClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const form = await db.giveawayForm.findUnique({ where: { slug } });
  if (!form) return { title: "Giveaway" };
  return {
    title: form.titleEn,
    description: form.descriptionEn ?? undefined,
    robots: { index: false, follow: false },
  };
}

export default async function GiveawayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const form = await db.giveawayForm.findUnique({ where: { slug } });
  if (!form || !form.isActive) notFound();

  // Serialize to plain object for the client component
  const data = {
    slug: form.slug,
    passType: form.passType as "night" | "weekend",
    en: {
      title: form.titleEn,
      description: form.descriptionEn ?? "",
      successMessage: form.successMessageEn ?? "",
    },
    fr: {
      title: form.titleFr ?? "",
      description: form.descriptionFr ?? "",
      successMessage: form.successMessageFr ?? "",
    },
    nl: {
      title: form.titleNl ?? "",
      description: form.descriptionNl ?? "",
      successMessage: form.successMessageNl ?? "",
    },
  };

  return <GiveawayClient form={data} />;
}
