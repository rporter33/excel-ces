"use client";

import { useState, useTransition } from "react";
import { claimUserRecord } from "@/lib/actions";
import { Loader2 } from "lucide-react";

interface User { id: string; name: string; email: string; role: string }

export function ClaimForm({
  clerkId,
  suggestedUserId,
  users,
}: {
  clerkId: string;
  suggestedUserId: string | null;
  users: User[];
}) {
  const [selectedId, setSelectedId] = useState(suggestedUserId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!selectedId) { setError("Please select your name."); return; }
    setError(null);
    startTransition(async () => {
      const result = await claimUserRecord(clerkId, selectedId);
      if (result?.error) setError(result.error);
    });
  }

  if (users.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-4">
        All user accounts are already linked. Contact an admin to add your account.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="label">I am</label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="input-field"
        >
          <option value="">— Select your name —</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.role.replace(/_/g, " ").toLowerCase()})
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={isPending || !selectedId}
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
