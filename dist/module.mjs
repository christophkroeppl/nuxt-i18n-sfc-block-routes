import { readdirSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { defineNuxtModule } from '@nuxt/kit';
import { parse } from 'vue/compiler-sfc';
import { parse as parse$1 } from 'yaml';

const jsonLangPattern = /\.?json5?/;
const vueExtPattern = /\.vue$/;
const groupParensPattern = /\/?\([^)]+\)\/?/g;
const trailingSlashesPattern = /\/+$/;
const module$1 = defineNuxtModule({
  meta: {
    name: "nuxt-i18n-sfc-block-routes",
    configKey: "i18nRoutes",
    compatibility: {
      nuxt: ">=3.0.0"
    }
  },
  setup(_, nuxt) {
    const translations = {};
    const seen = /* @__PURE__ */ new Set();
    for (const layer of nuxt.options._layers) {
      const pagesDir = resolve(layer.config.srcDir ?? layer.config.rootDir, "pages");
      if (seen.has(pagesDir)) continue;
      seen.add(pagesDir);
      scanDir(pagesDir, "", translations);
    }
    if (Object.keys(translations).length > 0) {
      nuxt.options.i18n ??= {};
      const i18nOpts = nuxt.options.i18n;
      if (!i18nOpts.pages) {
        i18nOpts.pages = translations;
      } else {
        const existing = i18nOpts.pages;
        for (const [key, paths] of Object.entries(translations)) {
          existing[key] = paths;
        }
      }
    }
    nuxt.hook("pages:extend", (pages) => {
      processPages(pages, nuxt.vfs);
    });
  }
});
function scanDir(dir, prefix, translations) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath, `${prefix}${entry.name}/`, translations);
    } else if (entry.name.endsWith(".vue")) {
      const pagePath = `${prefix}${entry.name.replace(vueExtPattern, "")}`;
      const source = readFileSync(fullPath, "utf-8");
      const i18nRoutes = extractI18nRoutes(source, fullPath);
      if (i18nRoutes) {
        const cleanPath = pagePath.replace(groupParensPattern, (m) => m.includes("/") ? "/" : "").replace(trailingSlashesPattern, "");
        translations[cleanPath] = i18nRoutes.paths;
        translations[pagePath] = i18nRoutes.paths;
      }
    }
  }
}
function processPages(pages, vfs) {
  if (!pages?.length) return;
  for (const page of pages) {
    if (page.children) processPages(page.children, vfs);
    if (!page.file) continue;
    const source = vfs[page.file] ?? readFileSafe(page.file);
    if (!source) continue;
    const i18nRoutes = extractI18nRoutes(source, page.file);
    if (i18nRoutes) {
      page.meta ??= {};
      page.meta.i18n = i18nRoutes;
    }
  }
}
function readFileSafe(path) {
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return void 0;
  }
}
function extractI18nRoutes(source, filePath) {
  const { descriptor } = parse(source, { filename: filePath });
  for (const block of descriptor.customBlocks) {
    if (block.type !== "i18n") continue;
    const content = block.content?.trim();
    if (!content) continue;
    const isJson = jsonLangPattern.test(block.attrs.lang);
    try {
      const parsed = isJson ? JSON.parse(content) : parse$1(content, void 0);
      if (!parsed || typeof parsed !== "object" || !("routes" in parsed)) continue;
      const routes = parsed.routes;
      if (!routes || typeof routes !== "object" || !("paths" in routes)) continue;
      const paths = routes.paths;
      if (!paths || typeof paths !== "object") continue;
      return { paths };
    } catch (err) {
      console.warn(
        `[i18n-routes] Failed to parse <i18n> block in ${filePath}:`,
        err.message
      );
    }
  }
  return null;
}

export { module$1 as default };
