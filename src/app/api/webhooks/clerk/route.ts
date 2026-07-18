// src/app/api/webhooks/clerk/route.ts
// Receives Clerk user.created events and creates a matching DB User record.
// Configure in Clerk Dashboard → Webhooks → endpoint URL: /api/webhooks/clerk
// Events to subscribe: user.created

import { Webhook } from "svix";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

interface ClerkEmailAddress {
  email_address: string;
  id: string;
}

interface ClerkUserCreatedEvent {
  type: "user.created";
  data: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email_addresses: ClerkEmailAddress[];
    primary_email_address_id: string | null;
  };
}

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.error("CLERK_WEBHOOK_SECRET is not set");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  // Read raw body for signature verification
  const body = await req.text();
  const headerPayload = await headers();

  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  // Verify signature
  const wh = new Webhook(secret);
  let event: ClerkUserCreatedEvent;
  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkUserCreatedEvent;
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "user.created") {
    return Response.json({ received: true }, { status: 200 });
  }

  const { id: clerkId, first_name, last_name, email_addresses, primary_email_address_id } = event.data;

  // Find primary email
  const primaryEmail = email_addresses.find(
    (e) => e.id === primary_email_address_id
  )?.email_address ?? email_addresses[0]?.email_address;

  if (!primaryEmail) {
    return new Response("No email address on user", { status: 400 });
  }

  const name = [first_name, last_name].filter(Boolean).join(" ") || primaryEmail;

  // If a DB User already exists with this email (manually provisioned), link the clerkId
  const existing = await prisma.user.findUnique({ where: { email: primaryEmail } });
  if (existing) {
    if (!existing.clerkId) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { clerkId },
      });
    }
    return Response.json({ received: true }, { status: 200 });
  }

  // Otherwise create a new DB User record
  try {
    await prisma.user.create({
      data: {
        clerkId,
        name,
        email: primaryEmail,
        role: "PROJECT_MANAGER",
        defaultMarkupPct: 0.30,
      },
    });
  } catch (e: any) {
    // Duplicate email — link clerkId to existing record
    if (e?.code === "P2002") {
      const byEmail = await prisma.user.findUnique({ where: { email: primaryEmail } });
      if (byEmail && !byEmail.clerkId) {
        await prisma.user.update({ where: { id: byEmail.id }, data: { clerkId } });
      }
    }
  }

  return Response.json({ received: true }, { status: 200 });
}
