<template>
  <div>
    <h1>{{ $t('about') }}</h1>
    <NuxtLinkLocale to="/">Home</NuxtLinkLocale>
  </div>
</template>

<i18n lang="yaml">
routes:
  paths:
    en: /about
    de: /ueber-uns
    fr: /a-propos
</i18n>
