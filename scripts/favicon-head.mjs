/** Shared favicon <head> markup — matches enterprise-public-site-static. */
export const FAVICON_HEAD = `
    <link rel="icon" href="/favicon/favicon.svg" type="image/svg+xml" />
    <link
      rel="icon"
      type="image/png"
      sizes="32x32"
      href="/favicon/icon-dark-32.png"
      media="(prefers-color-scheme: dark)"
    />
    <link
      rel="icon"
      type="image/png"
      sizes="32x32"
      href="/favicon/icon-light-32.png"
      media="(prefers-color-scheme: light)"
    />
    <link
      rel="icon"
      type="image/png"
      sizes="16x16"
      href="/favicon/icon-dark-16.png"
      media="(prefers-color-scheme: dark)"
    />
    <link
      rel="icon"
      type="image/png"
      sizes="16x16"
      href="/favicon/icon-light-16.png"
      media="(prefers-color-scheme: light)"
    />
    <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
    <link rel="manifest" href="/favicon/site.webmanifest" />
    <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#111111" media="(prefers-color-scheme: dark)" />`;

export const FAVICON_HEAD_LINKS = [
  { rel: 'icon', href: '/favicon/favicon.svg', type: 'image/svg+xml' },
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '32x32',
    href: '/favicon/icon-dark-32.png',
    media: '(prefers-color-scheme: dark)',
  },
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '32x32',
    href: '/favicon/icon-light-32.png',
    media: '(prefers-color-scheme: light)',
  },
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '16x16',
    href: '/favicon/icon-dark-16.png',
    media: '(prefers-color-scheme: dark)',
  },
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '16x16',
    href: '/favicon/icon-light-16.png',
    media: '(prefers-color-scheme: light)',
  },
  {
    rel: 'apple-touch-icon',
    sizes: '180x180',
    href: '/favicon/apple-touch-icon.png',
  },
  { rel: 'manifest', href: '/favicon/site.webmanifest' },
];
