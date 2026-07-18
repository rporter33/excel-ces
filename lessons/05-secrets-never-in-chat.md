# Secrets never get pasted into chat — rotate immediately if one leaks

**Type:** correction

A Clerk webhook signing secret (whsec_...) was pasted into a chat message.
Correct handling: regenerate it in the Clerk dashboard immediately, then supply
the new value only through `vercel env add CLERK_WEBHOOK_SECRET production`,
which prompts privately. Applies to all credentials: DB passwords, API keys,
signing secrets. .env files stay untracked; .env.example carries placeholders.
