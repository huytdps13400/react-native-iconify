import type { Config } from '@docusaurus/types';
import { themes as prismThemes } from 'prism-react-renderer';

const config: Config = {
  title: 'React Native Iconify',
  tagline: 'Typed, Metro-friendly Iconify workflow for React Native',
  url: 'https://react-native-iconify.dev',
  baseUrl: '/',
  favicon: 'img/favicon.svg',
  organizationName: 'react-native-iconify',
  projectName: 'docs',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  i18n: {
    defaultLocale: 'en',
    locales: ['en']
  },
  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.ts'),
          editUrl: 'https://github.com/react-native-iconify/react-native-iconify/tree/main/apps/docs/'
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css')
        }
      }
    ]
  ],
  themeConfig: {
    navbar: {
      title: 'React Native Iconify',
      items: [
        { type: 'docSidebar', sidebarId: 'guide', position: 'left', label: 'Guide' },
        {
          href: 'https://github.com/react-native-iconify/react-native-iconify',
          label: 'GitHub',
          position: 'right'
        }
      ]
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} React Native Iconify`
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula
    }
  }
};

export default config;

