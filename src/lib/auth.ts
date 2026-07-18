// src/lib/auth.ts
// Server-side auth helpers.
// - requireDbUser()       → for pages (server components) — redirects on failure
// - requireDbUserAction() → for server actions — throws an error on failure

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import type { User } from "@prisma/client";

// Role constants — map to UserRole enum values in schema.prisma
export const ROLE_PM = "PROJECT_MANAGER" as const;
export const ROLE_SALES_MANAGER = "SENIOR_PM" as const;

// All roles with leadership dashboard access
export const DASHBOARD_ROLES = [
  "SENIOR_PM",
  "OFFICE_ADMIN",
  "OPS_MANAGER",
  "SYSTEM_ADMIN",
] as const;

/**
 * For PAGES (server components) only.
 * Redirects to /sign-in or /setup on failure.
 * Uses auth() (lightweight session check) instead of currentUser() (Clerk API call).
 */
export async function requireDbUser(): Promise<{ dbUser: User }> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!dbUser) redirect("/setup");

  return { dbUser };
}

/**
 * For SERVER ACTIONS only.
 * Throws a plain Error on failure instead of calling redirect(),
 * which avoids the NEXT_REDIRECT throw leaking into action callers.
 */
export async function requireDbUserAction(): Promise<{ dbUser: User }> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Not signed in. Please refresh the page and sign in.");
  }

  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!dbUser) {
    throw new Error("Account not linked. Please complete setup at /setup.");
  }

  return { dbUser };
}

/**
 * Requires the DB user to have one of the specified roles.
 * Redirects to /unauthorized if the role check fails.
 */
export function requireRole(dbUser: User, ...allowedRoles: string[]): void {
  if (!allowedRoles.includes(dbUser.role)) {
    redirect("/unauthorized");
  }
}

/** Returns true if the user has access to the leadership dashboard. */
export function hasDashboardAccess(dbUser: User): boolean {
  return (DASHBOARD_ROLES as readonly string[]).includes(dbUser.role);
}
