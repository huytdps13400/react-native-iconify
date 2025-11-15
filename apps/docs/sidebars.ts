import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  guide: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      items: ['getting-started/react-native', 'getting-started/expo']
    },
    {
      type: 'category',
      label: 'Configuration',
      items: ['configuration/metro', 'configuration/babel-plugin', 'configuration/custom-icons']
    },
    {
      type: 'category',
      label: 'Optimization',
      items: ['optimization/bundle-size', 'optimization/ci']
    },
    'troubleshooting/common-issues'
  ]
};

export default sidebars;

