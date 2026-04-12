// @ts-check

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "AI-Basecamp",
  tagline: "AI knowledge base",
  favicon: "img/logo.svg",

  url: "https://example.com",
  baseUrl: "/",

  organizationName: "AI-Basecamp",
  projectName: "AI-Basecamp",

  onBrokenLinks: "throw",
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },

  i18n: {
    defaultLocale: "zh-CN",
    locales: ["zh-CN"],
  },

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: "/",
          sidebarPath: "./sidebars.js",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: "AI-Basecamp",
        logo: {
          alt: "AI-Basecamp Logo",
          src: "img/logo.svg",
        },
        items: [
          {
            type: "doc",
            docId: "site-updates/index",
            position: "left",
            label: "动态",
          },
          {
            type: "doc",
            docId: "news/index",
            position: "left",
            label: "资讯",
          },
          {
            type: "doc",
            docId: "knowledge-base/index",
            position: "left",
            label: "知识库",
          },
          // {
          //   href: "https://github.com/ai-dynamo/aiperf",
          //   label: "AIPerf",
          //   position: "right",
          // },
        ],
      },
      footer: {
        style: "light",
        copyright: `Copyright © ${new Date().getFullYear()} AI-Basecamp.`,
      },
      prism: {
        additionalLanguages: ["bash", "json", "powershell"],
      },
    }),
};

module.exports = config;
