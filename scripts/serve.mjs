// Minimal static server for local development and E2E tests.
// - Serves only files inside the repository root (path traversal blocked).
// - Unknown non-file paths fall back to index.html (SPA fallback).
// - Sends the same security headers we recommend for production hosting.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";

const ROOT = resolve(".");
const PORT = Number(process.env.PORT || 4173);
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8" };
const BLOCKED = [/^\/\.git/, /^\/node_modules/, /^\/\.env/, /^\/data\/snapshots/, /^\/scripts/, /^\/tests/, /^\/hostel-management/];
export const SECURITY_HEADERS = {
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "X-Frame-Options": "DENY",
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    let path = decodeURIComponent(url.pathname);
    if (BLOCKED.some((re) => re.test(path))) { res.writeHead(404, SECURITY_HEADERS); return res.end("Not found"); }
    let file = normalize(join(ROOT, path));
    if (!file.startsWith(ROOT + sep) && file !== ROOT) { res.writeHead(403, SECURITY_HEADERS); return res.end("Forbidden"); }
    let st = await stat(file).catch(() => null);
    if (st && st.isDirectory()) { file = join(file, "index.html"); st = await stat(file).catch(() => null); }
    if (!st) {
      if (extname(path)) { res.writeHead(404, SECURITY_HEADERS); return res.end("Not found"); }
      file = join(ROOT, "index.html"); // SPA fallback
    }
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] || "application/octet-stream", "Cache-Control": "no-cache", ...SECURITY_HEADERS });
    res.end(body);
  } catch (e) {
    res.writeHead(500, SECURITY_HEADERS);
    res.end("Server error");
  }
}).listen(PORT, "127.0.0.1", () => console.log(`Mera Haq dev server: http://127.0.0.1:${PORT}/`));
