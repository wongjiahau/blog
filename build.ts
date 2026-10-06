// Static build for GitHub Pages: bun build.ts  (BASEURL=/repo-name for project sites)
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, extname } from "node:path";
import { aboutPage, articles, homePage, render, root, site } from "./lib.ts";

const baseurl = (process.env.BASEURL ?? site.baseurl ?? "").replace(/\/$/, "");
const out = join(root, "_site");

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

for (const { dir } of articles()) {
  const from = join(root, "articles", dir);
  const to = join(out, "articles", dir);
  // Copy assets as-is; render index.html below.
  cpSync(from, to, { recursive: true });
  writeFileSync(join(to, "index.html"), render(readFileSync(join(from, "index.html"), "utf8"), baseurl));
  for (const f of readdirSync(to)) if (extname(f) === ".py") rmSync(join(to, f));
}

writeFileSync(join(out, "index.html"), homePage(baseurl));
mkdirSync(join(out, "about"), { recursive: true });
writeFileSync(join(out, "about", "index.html"), aboutPage(baseurl));
writeFileSync(join(out, ".nojekyll"), "");

console.log(`Built ${articles().length} article(s) into ${out} (baseurl "${baseurl}")`);
