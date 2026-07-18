"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", textAlign: "center", padding: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>Application Error</h2>
            <p style={{ color: "#6b7280", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
              A critical error occurred. Please refresh the page.
            </p>
            <button
              onClick={reset}
              style={{ background: "#1E2A4A", color: "white", padding: "0.5rem 1.25rem", borderRadius: "0.5rem", border: "none", cursor: "pointer" }}
            >
              Refresh
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
