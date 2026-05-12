import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "ZK-Student",
  tagline: "On-chain student identity backed by ZK proofs",
  favicon: "img/favicon.webp",

  url: "https://jows-labs.github.io",
  baseUrl: "/zk-student/",

  organizationName: "Jows-Labs",
  projectName: "zk-student",
  deploymentBranch: "gh-pages",
  trailingSlash: false,

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          routeBasePath: "/",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    navbar: {
      title: "ZK-Student",
      items: [
        {
          type: "docSidebar",
          sidebarId: "docs",
          position: "left",
          label: "Docs",
        },
        {
          href: "https://github.com/Jows-Labs/zk-student",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            { label: "Introduction", to: "/" },
            { label: "Prover API", to: "/prover-api" },
            { label: "Integration", to: "/integration" },
          ],
        },
        {
          title: "Links",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/Jows-Labs/zk-student",
            },
            {
              label: "Devnet Explorer",
              href: "https://explorer.solana.com/address/8GzzGmVbwTZ982GF7kpbchEf2VVv6wWXHZrmtj8dJJ4z?cluster=devnet",
            },
          ],
        },
      ],
      copyright: `Built by Jows Labs`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["rust", "bash", "json"],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
