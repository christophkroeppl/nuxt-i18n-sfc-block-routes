# nuxt-i18n-sfc-block-routes

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

Extract i18n route translations from Vue SFC `<i18n>` custom blocks and automatically configure [`@nuxtjs/i18n`](https://i18n.nuxtjs.org) route translations — no manual `pages` config needed.

## How It Works

This module scans your Nuxt `pages/` directory for `.vue` files containing `<i18n>` custom blocks with route path translations. It extracts the `routes.paths` mapping and populates `nuxt.options.i18n.pages` before `@nuxtjs/i18n` processes them.

Instead of maintaining a separate route translation config in `nuxt.config.ts`, you define translations **co-located with your page component**:

```vue
<!-- pages/landing.vue -->
<template>
  <h1>Welcome</h1>
</template>

<i18n lang="yaml">
routes:
  paths:
    en: /landing
    de: /start
    fr: /accueil
    es: /inicio
</i18n>
```

The module produces the equivalent of this in your `nuxt.config.ts`:

```ts
i18n: {
  customRoutes: 'config',
  pages: {
    landing: {
      en: '/landing',
      de: '/start',
      fr: '/accueil',
      es: '/inicio',
    }
  }
}
```

## Features

- **Co-located translations** — route paths live next to the page component that uses them
- **YAML & JSON support** — use `lang="yaml"` or `lang="json"` (or `json5`) on the `<i18n>` block
- **Route groups** — handles Nuxt route groups like `(groupName)/page.vue` correctly
- **Automatic integration** — populates `i18n.pages` config for `@nuxtjs/i18n` automatically
- **Zero runtime** — all extraction happens at build time via SFC parsing

## Quick Setup

Install the module:

```bash
# npm
npm install nuxt-i18n-sfc-block-routes

# pnpm
pnpm add nuxt-i18n-sfc-block-routes

# yarn
yarn add nuxt-i18n-sfc-block-routes

# bun
bun add nuxt-i18n-sfc-block-routes
```

Add it to your `nuxt.config.ts` **before** `@nuxtjs/i18n`:

```ts
export default defineNuxtConfig({
  modules: [
    'nuxt-i18n-sfc-block-routes',  // must come before @nuxtjs/i18n
    '@nuxtjs/i18n',
  ],
  i18n: {
    strategy: 'prefix_except_default',
    defaultLocale: 'en',
    customRoutes: 'config',  // required: tells i18n module to use custom route config
    locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'de', name: 'Deutsch', file: 'de.json' },
    ],
  },
})
```

> **Important:** This module must be listed **before** `@nuxtjs/i18n` in the modules array so it can populate `i18n.pages` before the i18n module processes routes.

## Usage

### YAML format (recommended)

```vue
<!-- pages/products.vue -->
<i18n lang="yaml">
routes:
  paths:
    en: /products
    de: /produkte
    fr: /produits
</i18n>
```

### JSON format

```vue
<!-- pages/contact.vue -->
<i18n lang="json">
{
  "routes": {
    "paths": {
      "en": "/contact",
      "de": "/kontakt",
      "fr": "/contactez-nous"
    }
  }
}
</i18n>
```

### Route groups

The module correctly handles Nuxt route groups (parenthesized directory names):

```vue
<!-- pages/(legal)/privacy.vue -->
<i18n lang="yaml">
routes:
  paths:
    en: /privacy-policy
    de: /datenschutz
    fr: /politique-de-confidentialite
</i18n>
```

The group prefix `(legal)` is stripped from the page key, so `@nuxtjs/i18n` receives the key `privacy` (not `(legal)/privacy`).

## Requirements

- Nuxt 3 or 4
- [`@nuxtjs/i18n`](https://i18n.nuxtjs.org) v10+ (peer dependency)

## How It Differs from Manual Config

| Approach | Pros | Cons |
|---|---|---|
| **Manual `nuxt.config.ts`** | All config in one place | Hard to maintain with many pages/locales; easy to forget routes |
| **This module** | Translations co-located with pages; auto-discovered | Requires `<i18n>` blocks in every translated page |

## License

[MIT](./LICENSE)

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/nuxt-i18n-sfc-block-routes/latest.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-version-href]: https://npmjs.com/package/nuxt-i18n-sfc-block-routes
[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-i18n-sfc-block-routes.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-downloads-href]: https://npmjs.com/package/nuxt-i18n-sfc-block-routes
[license-src]: https://img.shields.io/npm/l/nuxt-i18n-sfc-block-routes.svg?style=flat&colorA=18181B&colorB=28CF8D
[license-href]: https://npmjs.com/package/nuxt-i18n-sfc-block-routes
[nuxt-src]: https://img.shields.io/badge/Nuxt-18181B?logo=nuxt.js
[nuxt-href]: https://nuxt.com
