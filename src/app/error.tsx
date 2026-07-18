"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="max-w-sm">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 mx-auto">
          <span className="text-2xl">⚠</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-500 mb-6">
          {error.message?.includes("database") || error.message?.includes("prisma")
            ? "Could not connect to the database. Please try again."
            : "An unexpected error occurred. Please try again or contact support."}
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-primary text-sm">
            Try again
          </button>
          <Link href="/projects" className="btn-secondary text-sm">
            Go to Projects
          </Link>
        </div>
      </div>
    </div>
  );
}
