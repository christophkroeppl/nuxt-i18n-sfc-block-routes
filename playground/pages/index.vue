<template>
  <div>
    <h1>{{ $t('welcome') }}</h1>
    <nav>
      <NuxtLinkLocale to="/about">About</NuxtLinkLocale>
    </nav>
  </div>
</template>

<i18n lang="yaml">
routes:
  paths:
    en: /
    de: /startseite
    fr: /accueil
</i18n>
