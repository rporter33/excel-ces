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
  const clerkEmail = clerkUser?.emailAddresses?.[0]?.emailAddress ?? "";

  // Try to find a matching unlinked user by email
  const matchedUser = clerkEmail
    ? await prisma.user.findFirst({
        where: { email: clerkEmail, clerkId: null },
      })
    : null;

  // All unlinked users (for manual selection fallback)
  const unlinkedUsers = await prisma.user.findMany({
    where: { clerkId: null, isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true },
  });

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
              ? `We found a match for ${clerkEmail}. Confirm to continue.`
              : "Select your name to link your account."}
          </p>
        </div>

        <div className="card">
          {matchedUser ? (
            <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
              Email match found: <strong>{matchedUser.name}</strong>
            </div>
          ) : null}

          <ClaimForm
            clerkId={userId}
            suggestedUserId={matchedUser?.id ?? null}
            users={unlinkedUsers}
          />
        </div>
      </div>
    </div>
  );
}
