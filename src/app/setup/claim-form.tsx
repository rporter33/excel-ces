"use client";

import { useState, useTransition } from "react";
import { claimUserRecord } from "@/lib/actions";
import { Loader2 } from "lucide-react";

export function ClaimForm({
  matchedName,
  email,
}: {
  matchedName: string | null;
  email: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      // Identity + match are derived server-side; the action takes no input.
      const result = await claimUserRecord();
      if (result?.error) setError(result.error);
    });
  }

  if (!matchedName) {
    return (
      <p className="text-sm text-gray-500 text-center py-4">
        No staff record matches{email ? ` ${email}` : " your email"}. Ask an admin
        to add your account, then sign in again.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
        Link this login to <strong>{matchedName}</strong>?
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={isPending}
        className="btn-primary w-full disabled:opacity-60"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Linking account…
          </span>
        ) : (
          "Confirm and Continue"
        )}
      </button>
    </div>
  );
}
