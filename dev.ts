// Tiny dev server for previewing articles without Ruby/Jekyll.
// Run: bun dev.ts   (then open http://localhost:4000/articles/<name>/)
// Same renderer as build.ts (lib.ts), so what you see here is what gets deployed.
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { aboutPage, homePage, render, root } from "./lib.ts";

const port = Number(process.env.PORT ?? 4000);

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

Bun.serve({
  port,
  fetch(req) {
    let path = decodeURIComponent(new URL(req.url).pathname);
    if (path === "/") return new Response(homePage(""), { headers: { "content-type": types[".html"] } });
    if (path === "/about/") return new Response(aboutPage(""), { headers: { "content-type": types[".html"] } });
    let file = join(root, path);
    if (!file.startsWith(root)) return new Response("Forbidden", { status: 403 });
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!existsSync(file)) return new Response("Not found", { status: 404 });
    const type = types[extname(file)] ?? "application/octet-stream";
    if (extname(file) === ".html") {
      return new Response(render(readFileSync(file, "utf8"), ""), { headers: { "content-type": type } });
    }
    return new Response(Bun.file(file), { headers: { "content-type": type } });
  },
});

console.log(`Preview at http://localhost:${port}/`);
