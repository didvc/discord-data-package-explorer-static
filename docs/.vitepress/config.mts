import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Discord Data Package Explorer',
  description: 'Pure static, zero-telemetry tool to explore and search your Discord data package.',

  // No base since this will be deployed to a separate domain (discord-dpes.pages.dev)
  base: '/',

  locales: {
    root: {
      label: 'English',
      lang: 'en-US',
      link: '/',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/' },
          { text: 'Getting Started', link: '/getting-started' },
          { text: 'Searching', link: '/searching' },
          { text: 'Privacy', link: '/privacy' },
        ],
        sidebar: [
          {
            text: 'Guide',
            items: [
              { text: 'Getting Started', link: '/getting-started' },
              { text: 'Searching Your Messages', link: '/searching' },
            ]
          },
          {
            text: 'Reference',
            items: [
              { text: 'Privacy & Transparency', link: '/privacy' },
              { text: 'Data Package Format', link: '/data-format' },
            ]
          }
        ],
        socialLinks: [
          { icon: 'github', link: 'https://github.com/didvc/discord-data-package-explorer-static' }
        ],
        footer: {
          message: 'Documentation licensed under CC-BY-SA 4.0',
          copyright: '© 2026 Discord Data Package Explorer (Static)'
        }
      }
    },
    de: {
      label: 'Deutsch',
      lang: 'de',
      link: '/de/',
      themeConfig: {
        nav: [
          { text: 'Start', link: '/de/' },
          { text: 'Erste Schritte', link: '/de/getting-started' },
          { text: 'Suche', link: '/de/searching' },
          { text: 'Datenschutz', link: '/de/privacy' },
        ],
        sidebar: [
          {
            text: 'Anleitung',
            items: [
              { text: 'Erste Schritte', link: '/de/getting-started' },
              { text: 'Nachrichten durchsuchen', link: '/de/searching' },
            ]
          },
          {
            text: 'Referenz',
            items: [
              { text: 'Datenschutz & Transparenz', link: '/de/privacy' },
              { text: 'Datenpaket-Format', link: '/de/data-format' },
            ]
          }
        ],
        socialLinks: [
          { icon: 'github', link: 'https://github.com/didvc/discord-data-package-explorer-static' }
        ],
        footer: {
          message: 'Dokumentation lizenziert unter CC-BY-SA 4.0',
          copyright: '© 2026 Discord Data Package Explorer (Static)'
        }
      }
    },
    fr: {
      label: 'Français',
      lang: 'fr',
      link: '/fr/',
    },
    ru: {
      label: 'Русский',
      lang: 'ru',
      link: '/ru/',
    },
    zh: {
      label: '中文',
      lang: 'zh-CN',
      link: '/zh/',
    }
  },

  themeConfig: {
    // Fallback / English defaults
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting Started', link: '/getting-started' },
      { text: 'Searching', link: '/searching' },
      { text: 'Privacy', link: '/privacy' },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/getting-started' },
          { text: 'Searching Your Messages', link: '/searching' },
        ]
      },
      {
        text: 'Reference',
        items: [
          { text: 'Privacy & Transparency', link: '/privacy' },
          { text: 'Data Package Format', link: '/data-format' },
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/didvc/discord-data-package-explorer-static' }
    ],
    footer: {
      message: 'Documentation licensed under CC-BY-SA 4.0',
      copyright: '© 2026 Discord Data Package Explorer (Static)'
    }
  }
})
