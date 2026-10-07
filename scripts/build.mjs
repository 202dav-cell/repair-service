import { readFile, writeFile, mkdir, rm, cp } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { build, transform } from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");
const dist = join(root, "dist");

const jsFiles = [
  "js/config/supabase.js",
  "js/core/state.js",
  "js/utils/format.js",
  "js/utils/html.js",
  "js/services/auth.service.js",
  "js/services/clients.service.js",
  "js/services/repairs.service.js",
  "js/services/employees.service.js",
  "js/ui/auth.ui.js",
  "js/ui/repairs.ui.js",
  "js/ui/clients.ui.js",
  "js/ui/repair-modal.ui.js",
  "js/ui/employees.ui.js",
  "js/app.js"
];

await rm(dist, { recursive: true, force: true });
await mkdir(join(dist, "js"), { recursive: true });
await mkdir(join(dist, "css"), { recursive: true });

const combinedJs = (await Promise.all(
  jsFiles.map(async file => readFile(join(src, file), "utf8"))
)).join("\n;\n");

const minified = await transform(combinedJs, {
  minify: true,
  legalComments: "none",
  target: "es2020"
});

await writeFile(join(dist, "js", "app.min.js"), minified.code, "utf8");

await build({
  entryPoints: [join(src, "css", "style.css")],
  outfile: join(dist, "css", "app.min.css"),
  bundle: false,
  minify: true,
  legalComments: "none"
});

let html = await readFile(join(src, "index.html"), "utf8");
html = html
  .replace('href="css/style.css"', 'href="css/app.min.css"')
  .replace("</body>", '    <script src="js/app.min.js"></script>\n</body>');

await writeFile(join(dist, "index.html"), html, "utf8");

for (const folder of ["assets"]) {
  try {
    await cp(join(src, folder), join(dist, folder), { recursive: true });
  } catch {
    // Assets are optional.
  }
}

console.log("DAV Service build complete.");
