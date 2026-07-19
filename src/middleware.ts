import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes that remain public (no login required)
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/(.*)",     // Clerk and other service webhooks — signed separately
]);
// NOTE: /dev/* is intentionally NOT public. /dev/accuracy-test renders real
// customer names and profit figures; it must require a signed-in user.

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
