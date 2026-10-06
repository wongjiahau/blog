// Shared by build.ts (GitHub Actions) and dev.ts (local preview).
// Handles only the Liquid bits this blog uses; there is no Jekyll or Ruby involved.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export const root = import.meta.dir;

export const parseYaml = (text: string) => {
  const out: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
};

export const site = parseYaml(readFileSync(join(root, "_config.yml"), "utf8"));

export const splitFrontMatter = (src: string) => {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?/);
  return m ? { page: parseYaml(m[1]), body: src.slice(m[0].length) } : { page: {}, body: src };
};

export const escapeHtml = (s: string) =>
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

/** Fill in {{ page.x | filter }} and {{ site.x }} placeholders in an article. */
export const render = (src: string, baseurl = site.baseurl ?? "") => {
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
      else if (f === "relative_url") value = baseurl + value;
      else if (f.startsWith("date:")) value = formatDate(value, f.slice(5).trim().slice(1, -1));
    }
    return value;
  });
};

export const articles = () =>
  readdirSync(join(root, "articles"))
    .filter((d) => existsSync(join(root, "articles", d, "index.html")))
    .map((d) => ({
      dir: d,
      ...splitFrontMatter(readFileSync(join(root, "articles", d, "index.html"), "utf8")).page,
    }))
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

const shell = (title: string, body: string, baseurl: string) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    :root { --bg:#fbfaf7; --fg:#1d1d1b; --muted:#6b6a64; --accent:#b4491f; }
    @media (prefers-color-scheme: dark) { :root { --bg:#16150f; --fg:#ecebe4; --muted:#9b9a90; --accent:#f0875a; } }
    body { margin:0; background:var(--bg); color:var(--fg); font:1.125rem/1.7 Georgia, serif; }
    main { max-width:42rem; margin:0 auto; padding:2rem 1rem 5rem; }
    nav { font:0.95rem system-ui, sans-serif; display:flex; gap:1rem; }
    a { color:var(--accent); }
    .meta { font:0.85rem system-ui, sans-serif; color:var(--muted); }
    ul { list-style:none; padding:0; }
    li { margin:1.5rem 0; }
    h3 { margin:0.1rem 0; }
  </style>
</head>
<body>
<main>
  <nav><a href="${baseurl}/">${escapeHtml(site.title)}</a><a href="${baseurl}/about/">About</a></nav>
${body}
</main>
</body>
</html>
`;

export const homePage = (baseurl = site.baseurl ?? "") =>
  shell(
    site.title,
    `<h2>Articles</h2>\n<ul>\n${articles()
      .map(
        (a) =>
          `<li><span class="meta">${formatDate(a.date, "%b %-d, %Y")}</span>` +
          `<h3><a href="${baseurl}/articles/${a.dir}/">${escapeHtml(a.title)}</a></h3>` +
          (a.subtitle ? `<p>${escapeHtml(a.subtitle)}</p>` : "") +
          `</li>`,
      )
      .join("\n")}\n</ul>`,
    baseurl,
  );

export const aboutPage = (baseurl = site.baseurl ?? "") => {
  const { page, body } = splitFrontMatter(readFileSync(join(root, "about.md"), "utf8"));
  const paragraphs = body
    .trim()
    .split(/\n\s*\n/)
    .map((p) => `<p>${escapeHtml(p.trim())}</p>`)
    .join("\n");
  return shell(page.title ?? "About", `<h1>${escapeHtml(page.title ?? "About")}</h1>\n${paragraphs}`, baseurl);
};
