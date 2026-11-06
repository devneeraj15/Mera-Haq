// Production build: bundles src/app/main.jsx (React + engine) into app.js.
// Output stays at the repository root so GitHub Pages can keep serving the
// root without a deploy workflow. No runtime CDN scripts and no in-browser Babel.
import { build } from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const result = await build({
  entryPoints: ["src/app/main.jsx"],
  bundle: true,
  minify: true,
  sourcemap: false,
  target: ["es2019", "chrome90", "firefox88", "safari14"],
  format: "iife",
  outfile: "app.js",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  legalComments: "none",
  metafile: true,
  logLevel: "info",
});

// Cache-busting: stamp content hashes into index.html
const hash = (f) => createHash("sha256").update(readFileSync(f)).digest("hex").slice(0, 10);
let html = readFileSync("index.html", "utf8");
html = html.replace(/app\.js\?v=[\w.]+/, `app.js?v=${hash("app.js")}`).replace(/styles\.css\?v=[\w.]+/, `styles.css?v=${hash("styles.css")}`);
writeFileSync("index.html", html);

const bytes = Object.values(result.metafile.outputs).reduce((a, o) => a + o.bytes, 0);
writeFileSync("data/reports/bundle-size.json", JSON.stringify({ builtAt: new Date().toISOString(), appJsBytes: bytes }, null, 1));
console.log(`app.js: ${(bytes / 1024).toFixed(1)} KiB`);
