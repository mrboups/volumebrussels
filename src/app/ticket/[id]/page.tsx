import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import TicketClient from "./TicketClient";

export const dynamic = "force-dynamic";

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const ticket = await db.ticket.findUnique({
    where: { id },
    include: {
      event: {
        include: { club: true },
      },
    },
  });

  if (!ticket) {
    notFound();
  }

  const serializedTicket = {
    ...ticket,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    validatedAt: ticket.validatedAt?.toISOString() ?? null,
    event: {
      ...ticket.event,
      date: ticket.event.date.toISOString(),
      createdAt: ticket.event.createdAt.toISOString(),
      updatedAt: ticket.event.updatedAt.toISOString(),
      club: ticket.event.club
        ? {
            ...ticket.event.club,
            createdAt: ticket.event.club.createdAt.toISOString(),
            updatedAt: ticket.event.club.updatedAt.toISOString(),
          }
        : null,
    },
  };

  return <TicketClient ticket={serializedTicket} />;
}
