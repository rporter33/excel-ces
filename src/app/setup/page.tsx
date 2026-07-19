// src/app/setup/page.tsx
// First-login claiming flow: links a new Clerk user to their existing DB User record.
// Triggered automatically from middleware when clerkId is not found in DB.
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ClaimForm } from "./claim-form";

export default async function SetupPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // If user already has a DB record, skip setup
  const existing = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (existing) redirect("/projects");

  const clerkUser = await currentUser();
  const primaryId = clerkUser?.primaryEmailAddressId;
  const clerkEmail =
    clerkUser?.emailAddresses?.find((e) => e.id === primaryId)?.emailAddress ??
    clerkUser?.emailAddresses?.[0]?.emailAddress ??
    "";

  // Only an unlinked record whose email matches the verified sign-in email is
  // claimable. We never list other staff records or their roles — that let a
  // stranger pick and claim an admin account. The claim action re-derives this
  // match server-side; nothing here is trusted as input to the claim.
  const matchedUser = clerkEmail
    ? await prisma.user.findFirst({
        where: { email: { equals: clerkEmail, mode: "insensitive" }, clerkId: null },
        select: { name: true },
      })
    : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-navy text-white font-bold text-lg">
            ER
          </div>
          <h1 className="text-xl font-bold text-gray-900">Welcome to Excel CES</h1>
          <p className="text-sm text-gray-500 mt-1">
            {matchedUser
              ? `Confirm your account to continue.`
              : "Account setup"}
          </p>
        </div>

        <div className="card">
          <ClaimForm matchedName={matchedUser?.name ?? null} email={clerkEmail} />
        </div>
      </div>
    </div>
  );
}
