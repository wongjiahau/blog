// Tiny dev server for previewing articles without Ruby/Jekyll.
// Run: bun dev.ts   (then open http://localhost:4000/articles/<name>/)
// Only handles the Liquid bits the article pages use; the real build is still Jekyll on GitHub Pages.
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const root = import.meta.dir;
const port = Number(process.env.PORT ?? 4000);

const parseYaml = (text: string) => {
  const out: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
};

const site = parseYaml(readFileSync(join(root, "_config.yml"), "utf8"));

const splitFrontMatter = (src: string) => {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?/);
  return m ? { page: parseYaml(m[1]), body: src.slice(m[0].length) } : { page: {}, body: src };
};

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const formatDate = (value: string, fmt: string) => {
  const d = new Date(value + "T00:00:00");
  const month = d.toLocaleString("en", { month: "long" });
  return fmt
    .replace("%B", month)
    .replace("%b", month.slice(0, 3))
    .replace("%-d", String(d.getDate()))
    .replace("%Y", String(d.getFullYear()));
};

const render = (src: string) => {
  const { page, body } = splitFrontMatter(src);
  const ctx: Record<string, Record<string, string>> = { page, site };
  return body.replace(/\{\{\s*(.*?)\s*\}\}/g, (_, expr: string) => {
    const [head, ...filters] = expr.split("|").map((s) => s.trim());
    let value = /^['"]/.test(head)
      ? head.slice(1, -1)
      : (() => {
          const [obj, key] = head.split(".");
          return ctx[obj]?.[key] ?? "";
        })();
    for (const f of filters) {
      if (f === "escape") value = escapeHtml(value);
      else if (f === "relative_url") value = (site.baseurl ?? "") + value;
      else if (f.startsWith("date:")) value = formatDate(value, f.slice(5).trim().slice(1, -1));
    }
    return value;
  });
};

const types: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
};

const articleIndex = () => {
  const items = readdirSync(join(root, "articles"))
    .filter((d) => existsSync(join(root, "articles", d, "index.html")))
    .map((d) => {
      const { page } = splitFrontMatter(readFileSync(join(root, "articles", d, "index.html"), "utf8"));
      return `<li><a href="/articles/${d}/">${escapeHtml(page.title ?? d)}</a></li>`;
    });
  return `<!doctype html><meta charset="utf-8"><title>${site.title}</title><body style="font:1.1rem system-ui;max-width:40rem;margin:3rem auto"><h1>${site.title}</h1><ul>${items.join("")}</ul>`;
};

Bun.serve({
  port,
  fetch(req) {
    let path = decodeURIComponent(new URL(req.url).pathname);
    if (path === "/") return new Response(articleIndex(), { headers: { "content-type": types[".html"] } });
    let file = join(root, path);
    if (!file.startsWith(root)) return new Response("Forbidden", { status: 403 });
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!existsSync(file)) return new Response("Not found", { status: 404 });
    const type = types[extname(file)] ?? "application/octet-stream";
    if (extname(file) === ".html") {
      return new Response(render(readFileSync(file, "utf8")), { headers: { "content-type": type } });
    }
    return new Response(Bun.file(file), { headers: { "content-type": type } });
  },
});

console.log(`Preview at http://localhost:${port}/`);
