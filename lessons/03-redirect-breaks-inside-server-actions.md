# redirect() inside a shared auth helper crashes server actions — split the pattern

**Type:** correction

requireDbUser() used next/navigation redirect(). That works in page server
components but throws unhandled inside server actions, which surfaced as
"Something went wrong" on every page whose actions called it. Rule: pages may
redirect; server actions must return an error object (or throw a typed error
the caller handles). Either maintain two helpers (requireDbUserPage /
requireDbUserAction) or make the helper context-aware.
