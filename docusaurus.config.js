// @ts-check

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "AI-Basecamp",
  tagline: "AI knowledge base",
  favicon: "img/logo.png",

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
          showLastUpdateTime: true,
        },
        blog: {
          routeBasePath: "blog",
          blogTitle: "资讯",
          blogDescription: "AI 行业动态、产品发布、重要论文、产业政策和事件跟踪。",
          showReadingTime: true,
          blogSidebarTitle: "资讯",
          blogSidebarCount: "ALL",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      }),
    ],
  ],

  themes: [
    [
      "@easyops-cn/docusaurus-search-local",
      {
        hashed: true,
        language: ["zh", "en"],
        indexDocs: true,
        indexBlog: true,
        indexPages: true,
        docsRouteBasePath: "/",
        blogRouteBasePath: "/blog",
      },
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: "AI-Basecamp",
        logo: {
          alt: "AI-Basecamp Logo",
          src: "img/logo.png",
        },
        items: [
          {
            to: "/site-updates",
            position: "left",
            label: "动态",
          },
          {
            to: "/blog",
            position: "left",
            label: "资讯",
          },
          {
            type: "doc",
            docId: "knowledge-base",
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
      docs: {
        sidebar: {
          autoCollapseCategories: true,
          hideable: true,
        },
      },
      prism: {
        additionalLanguages: ["bash", "json", "powershell"],
      },
    }),
};

module.exports = config;
