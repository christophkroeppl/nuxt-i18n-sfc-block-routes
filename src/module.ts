import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { defineNuxtModule } from '@nuxt/kit'
import { parse as parseSFC } from 'vue/compiler-sfc'
import { parse as parseYaml } from 'yaml'
import type { NuxtPage } from 'nuxt/schema'

const jsonLangPattern = /\.?json5?/
const vueExtPattern = /\.vue$/
const groupParensPattern = /\/?\([^)]+\)\/?/g
const trailingSlashesPattern = /\/+$/

export default defineNuxtModule({
  meta: {
    name: 'nuxt-i18n-sfc-block-routes',
    configKey: 'i18nRoutes',
    compatibility: {
      nuxt: '>=3.0.0',
    },
  },
  setup(_, nuxt) {
    // ── 1. Scan pages dir for i18n route blocks ──────────────────────────
    //    Scan all layers (including the root) so that pages defined in
    //    Nuxt layers are discovered alongside root-level pages.
    const translations: Record<string, Record<string, string>> = {}

    const seen = new Set<string>()
    for (const layer of nuxt.options._layers) {
      const pagesDir = resolve(layer.config.srcDir ?? layer.config.rootDir, 'pages')
      if (seen.has(pagesDir)) continue
      seen.add(pagesDir)
      scanDir(pagesDir, '', translations)
    }

    // ── 2. Populate nuxt.options.i18n.pages BEFORE any hooks fire ────────
    //    @nuxtjs/i18n creates NuxtPageAnalyzeContext(options.pages) inside its
    //    pages:extend hook.  options === nuxt.options.i18n (same reference).
    //    By setting pages early, the i18n module will see them in both dev
    //    (routes resolved on-the-fly) and prod (prerender step).
    if (Object.keys(translations).length > 0) {
      nuxt.options.i18n ??= {} as Record<string, unknown>
      const i18nOpts = nuxt.options.i18n as Record<string, unknown>

      // Use the existing object if it exists, otherwise create one
      if (!i18nOpts.pages) {
        i18nOpts.pages = translations
      }
      else {
        const existing = i18nOpts.pages as Record<string, Record<string, string>>
        for (const [key, paths] of Object.entries(translations)) {
          existing[key] = paths
        }
      }

    }

    // ── 3. Also extract into page.meta.i18n for completeness ─────────────
    nuxt.hook('pages:extend', (pages) => {
      processPages(pages, nuxt.vfs)
    })
  },
})

// ── Recursive directory scanner ──────────────────────────────────────────
function scanDir(
  dir: string,
  prefix: string,
  translations: Record<string, Record<string, string>>,
) {
  let entries: Dirent[]
  try {
    entries = readdirSync(dir, { withFileTypes: true }) as unknown as Dirent[]
  }
  catch {
    return
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      scanDir(fullPath, `${prefix}${entry.name}/`, translations)
    }
    else if (entry.name.endsWith('.vue')) {
      const pagePath = `${prefix}${entry.name.replace(vueExtPattern, '')}`
      const source = readFileSync(fullPath, 'utf-8')
      const i18nRoutes = extractI18nRoutes(source, fullPath)
      if (i18nRoutes) {
        // Key by the page path that @nuxtjs/i18n analyzePagePath produces
        const cleanPath = pagePath
          .replace(groupParensPattern, m => m.includes('/') ? '/' : '')
          .replace(trailingSlashesPattern, '')
        translations[cleanPath] = i18nRoutes.paths

        // Also add with original path (with group parens) as fallback
        translations[pagePath] = i18nRoutes.paths
      }
    }
  }
}

interface Dirent {
  name: string
  isDirectory(): boolean
}

// ── Pages-extend helper ──────────────────────────────────────────────────
function processPages(pages: NuxtPage[], vfs: Record<string, string>) {
  if (!pages?.length) return

  for (const page of pages) {
    if (page.children) processPages(page.children, vfs)
    if (!page.file) continue

    const source = vfs[page.file] ?? readFileSafe(page.file)
    if (!source) continue

    const i18nRoutes = extractI18nRoutes(source, page.file)
    if (i18nRoutes) {
      page.meta ??= {}
      page.meta.i18n = i18nRoutes
    }
  }
}

function readFileSafe(path: string): string | undefined {
  try {
    return readFileSync(path, 'utf-8')
  }
  catch {
    return undefined
  }
}

function extractI18nRoutes(
  source: string,
  filePath: string,
): { paths: Record<string, string> } | null {
  const { descriptor } = parseSFC(source, { filename: filePath })

  for (const block of descriptor.customBlocks) {
    if (block.type !== 'i18n') continue

    const content = block.content?.trim()
    if (!content) continue

    const isJson = jsonLangPattern.test(block.attrs.lang as string)

    try {
      const parsed = (isJson ? JSON.parse(content) : parseYaml(content, undefined)) as Record<string, unknown>
      if (!parsed || typeof parsed !== 'object' || !('routes' in parsed)) continue

      const routes = parsed.routes as Record<string, unknown>
      if (!routes || typeof routes !== 'object' || !('paths' in routes)) continue

      const paths = routes.paths as Record<string, string>
      if (!paths || typeof paths !== 'object') continue

      return { paths }
    }
    catch (err) {
      console.warn(
        `[i18n-routes] Failed to parse <i18n> block in ${filePath}:`,
        (err as Error).message,
      )
    }
  }

  return null
}
