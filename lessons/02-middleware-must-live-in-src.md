# middleware.ts must be at src/middleware.ts when the app uses a src directory

**Type:** correction

Clerk threw "clerkMiddleware() was not run, your middleware file might be
misplaced" and every authenticated page error-boundaried. The file was at the
project root; with a src/ layout Next.js only picks it up at src/middleware.ts.
Keep exactly one copy, in src/. If both exist, delete the root one.
