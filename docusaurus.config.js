// @ts-check

const remarkMath = require("remark-math").default;
const rehypeKatex = require("rehype-katex").default;

/**
 * Normalize inline citation links before MDX turns Markdown into React code.
 *
 * Content authors can keep writing citations in the compact Markdown form:
 *   [citation:IT之家](https://example.com)
 *
 * This remark plugin handles the straightforward mdast case where the citation
 * is still a normal Markdown `link` node. It removes the machine-readable
 * `citation:` prefix from the visible text and marks the link for CSS styling.
 */
function remarkCitationLinks() {
  // A link label can contain nested nodes, so collect the visible text instead
  // of assuming `node.children[0].value` always exists.
  function getText(node) {
    if (!node || typeof node !== "object") {
      return "";
    }

    if (node.type === "text") {
      return node.value ?? "";
    }

    if (Array.isArray(node.children)) {
      return node.children.map(getText).join("");
    }

    return "";
  }

  // Once a citation is recognized, replace the label with a plain text node.
  // This prevents MDX from later preserving fragments like "citation", ":IT".
  function replaceText(node, value) {
    node.children = [{ type: "text", value }];
  }

  // Docusaurus passes `data.hProperties` through to the rendered link element.
  // The CSS uses `citation-link` to render the source as a small source chip.
  function markCitationLink(node, sourceName) {
    node.data = {
      ...node.data,
      hProperties: {
        ...node.data?.hProperties,
        className: "citation-link",
        title: `来源：${sourceName}`,
      },
    };
  }

  function visit(node) {
    if (!node || typeof node !== "object") {
      return;
    }

    // Standard Markdown citation link, for example:
    // [citation:量子位](https://www.qbitai.com/...)
    if (node.type === "link") {
      const linkText = getText(node);
      const sourceName = linkText.replace(/^citation\s*[:：]\s*/i, "");

      if (sourceName !== linkText) {
        replaceText(node, sourceName);
        markCitationLink(node, sourceName);
      }
    }

    // Fallback for malformed or not-yet-parsed citation text that still appears
    // as a raw text node. This keeps older drafts from leaking `citation:`.
    if (node.type === "text") {
      const match = node.value.match(
        /^\s*\[citation\s*[:：]\s*([^\]]+)\]\(([^)\s]+)\)\s*$/i,
      );

      if (match) {
        node.type = "link";
        node.url = match[2];
        node.children = [{ type: "text", value: match[1] }];
        markCitationLink(node, match[1]);
        return;
      }
    }

    // Keep the traversal dependency-free; the site already has enough build
    // dependencies, and this tree is small enough for a simple recursive walk.
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        value.forEach(visit);
      } else if (value && typeof value === "object") {
        visit(value);
      }
    }
  }

  return (tree) => visit(tree);
}

/**
 * Final citation cleanup after Markdown has become HTML/MDX nodes.
 *
 * Some labels that contain ASCII words or acronyms, such as `citation:IT之家`
 * or `citation:Stanford HAI`, may be split by the MDX compiler into multiple
 * React children. In that shape, the remark plugin above can miss them or only
 * normalize part of the label. This rehype plugin works later, against the
 * rendered `<a>` node's visible text, so it catches those split-child cases.
 *
 * Keeping both plugins is intentional:
 * - remark handles clean Markdown links early;
 * - rehype is the safety net for MDX-transformed links.
 */
function rehypeCitationLinks() {
  // Reconstruct the human-visible label from the HTML AST children.
  // Example split children can still produce "citation:IT之家" here.
  function getText(node) {
    if (!node || typeof node !== "object") {
      return "";
    }

    if (node.type === "text") {
      return node.value ?? "";
    }

    if (Array.isArray(node.children)) {
      return node.children.map(getText).join("");
    }

    return "";
  }

  // Preserve any class Docusaurus already attached, then add our citation class.
  // Replace children with a single text node so the browser never displays the
  // internal `citation:` marker.
  function markCitationLink(node, sourceName) {
    const className = node.properties?.className ?? [];
    const classes = Array.isArray(className)
      ? className
      : String(className).split(/\s+/);

    node.properties = {
      ...node.properties,
      className: [...new Set([...classes.filter(Boolean), "citation-link"])],
      title: `来源：${sourceName}`,
    };
    node.children = [{ type: "text", value: sourceName }];
  }

  function visit(node) {
    if (!node || typeof node !== "object") {
      return;
    }

    // Match real rendered links only. The regex accepts both English and Chinese
    // colons so authors do not have to remember one exact punctuation mark.
    if (node.type === "element" && node.tagName === "a") {
      const linkText = getText(node);
      const sourceName = linkText.replace(/^citation\s*[:：]\s*/i, "");

      if (sourceName !== linkText) {
        markCitationLink(node, sourceName);
      }
    }

    // Same small recursive walker as the remark plugin. We avoid mutating any
    // unrelated nodes unless their visible link text starts with `citation:`.
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        value.forEach(visit);
      } else if (value && typeof value === "object") {
        visit(value);
      }
    }
  }

  return (tree) => visit(tree);
}

const remarkPlugins = [remarkMath, remarkCitationLinks];
const rehypePlugins = [rehypeKatex, rehypeCitationLinks];

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "AI-Basecamp",
  tagline: "AI knowledge base",
  favicon: "favicon.ico",

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
        debug: false,
        docs: {
          routeBasePath: "/",
          sidebarPath: "./sidebars.js",
          showLastUpdateTime: true,
          remarkPlugins,
          rehypePlugins,
        },
        blog: {
          routeBasePath: "blog",
          blogTitle: "资讯",
          blogDescription:
            "AI 行业动态、产品发布、重要论文、产业政策和事件跟踪。",
          showReadingTime: true,
          blogSidebarTitle: "资讯",
          blogSidebarCount: "ALL",
          remarkPlugins,
          rehypePlugins,
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
        pages: {
          remarkPlugins,
          rehypePlugins,
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
          {
            to: "/changelog",
            position: "right",
            label: "changelog",
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
