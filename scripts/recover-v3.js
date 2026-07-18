// Recover source from Vercel — v3.
// Targets an exact scope + project (no guessing), and can authenticate with
// either an explicit token or the Vercel CLI's stored credentials.
//
// Usage (PowerShell):
//   $env:SCOPE_SLUG="your-team-or-user-slug"   # from vercel.com/<SCOPE_SLUG>/<PROJECT>
//   $env:PROJECT="your-project-name"
//   node recover-v3.js
// Auth: uses $env:VERCEL_TOKEN if set, otherwise reads the token the Vercel
// CLI saved during `vercel login` (never hardcode a token in this file).
//
// Output: ./<PROJECT>-recovered/ containing the full source tree of the
// latest READY production deployment (node_modules excluded).

const fs = require("fs");
const path = require("path");
const os = require("os");

const API = "https://api.vercel.com";
const SCOPE = process.env.SCOPE_SLUG;
const PROJECT = process.env.PROJECT;

if (!SCOPE || !PROJECT) {
  console.error("Set SCOPE_SLUG and PROJECT first (from vercel.com/<SCOPE_SLUG>/<PROJECT>).");
  process.exit(1);
}

function cliToken() {
  const home = os.homedir();
  const candidates = [
    path.join(process.env.APPDATA || "", "xdg.data", "com.vercel.cli", "auth.json"),
    path.join(home, ".local", "share", "com.vercel.cli", "auth.json"),
    path.join(process.env.LOCALAPPDATA || "", "com.vercel.cli", "auth.json"),
    path.join(home, "Library", "Application Support", "com.vercel.cli", "auth.json"),
  ];
  for (const p of candidates) {
    try {
      const j = JSON.parse(fs.readFileSync(p, "utf8"));
      if (j.token) { console.log("Using Vercel CLI stored credentials:", p); return j.token; }
    } catch { /* try next */ }
  }
  return null;
}

const TOKEN = process.env.VERCEL_TOKEN || cliToken();
if (!TOKEN) {
  console.error("No auth found. Either run `npx vercel login` or set $env:VERCEL_TOKEN.");
  process.exit(1);
}
const headers = { Authorization: `Bearer ${TOKEN}` };
const scopeQ = `slug=${encodeURIComponent(SCOPE)}`;

async function getJson(url) {
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`${url} -> ${r.status} ${await r.text()}`);
  return r.json();
}

(async () => {
  // 1. Resolve the project directly in the given scope
  const project = await getJson(`${API}/v9/projects/${encodeURIComponent(PROJECT)}?${scopeQ}`);
  console.log(`Project "${project.name}" (${project.id}) in scope ${SCOPE}`);

  // 2. Latest READY deployment, preferring production
  const deps = await getJson(`${API}/v6/deployments?projectId=${project.id}&limit=20&${scopeQ}`);
  const list = deps.deployments || [];
  if (!list.length) throw new Error("Project found but has no deployments.");
  const dep = list.find(d => d.target === "production" && d.state === "READY")
    || list.find(d => d.state === "READY") || list[0];
  console.log("Recovering deployment:", dep.uid, "|", dep.url,
    "|", dep.created ? new Date(dep.created).toISOString() : "?");

  // 3. Fetch the file tree and download everything
  const tree = await getJson(`${API}/v6/deployments/${dep.uid}/files?${scopeQ}`);
  const outDir = path.join(process.cwd(), `${PROJECT}-recovered`);
  let count = 0, skipped = 0;

  async function walk(nodes, rel) {
    for (const n of nodes) {
      if (n.type === "directory") {
        if (n.name === "node_modules") continue;
        await walk(n.children || [], path.join(rel, n.name));
      } else if (n.type === "file") {
        const r = await fetch(`${API}/v7/deployments/${dep.uid}/files/${n.uid}?${scopeQ}`, { headers });
        if (!r.ok) { console.warn("  skip:", path.join(rel, n.name), r.status); skipped++; continue; }
        let buf;
        const ct = r.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const body = await r.json();
          buf = Buffer.from(body.data, "base64");
        } else buf = Buffer.from(await r.arrayBuffer());
        const p = path.join(outDir, rel, n.name);
        fs.mkdirSync(path.dirname(p), { recursive: true });
        fs.writeFileSync(p, buf);
        count++;
        if (count % 25 === 0) console.log(`  ${count} files...`);
      }
    }
  }
  await walk(Array.isArray(tree) ? tree : tree.files || [], "");
  console.log(`\nDone: ${count} files -> ${outDir}` + (skipped ? ` (${skipped} skipped)` : ""));
  if (!count) console.error("Zero files downloaded — the deployment may not include source (git-built?).");
})().catch(e => { console.error("\nRecovery failed:", e.message); process.exit(1); });
