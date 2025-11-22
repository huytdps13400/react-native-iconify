import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/',
    component: ComponentCreator('/', 'e5f'),
    exact: true
  },
  {
    path: '/',
    component: ComponentCreator('/', '212'),
    routes: [
      {
        path: '/',
        component: ComponentCreator('/', '368'),
        routes: [
          {
            path: '/',
            component: ComponentCreator('/', '8d1'),
            routes: [
              {
                path: '/configuration/babel-plugin',
                component: ComponentCreator('/configuration/babel-plugin', '540'),
                exact: true,
                sidebar: "guide"
              },
              {
                path: '/configuration/custom-icons',
                component: ComponentCreator('/configuration/custom-icons', '2d0'),
                exact: true,
                sidebar: "guide"
              },
              {
                path: '/configuration/metro',
                component: ComponentCreator('/configuration/metro', '2c6'),
                exact: true,
                sidebar: "guide"
              },
              {
                path: '/getting-started/expo',
                component: ComponentCreator('/getting-started/expo', '81a'),
                exact: true,
                sidebar: "guide"
              },
              {
                path: '/getting-started/react-native',
                component: ComponentCreator('/getting-started/react-native', '76d'),
                exact: true,
                sidebar: "guide"
              },
              {
                path: '/intro',
                component: ComponentCreator('/intro', 'fb3'),
                exact: true,
                sidebar: "guide"
              },
              {
                path: '/optimization/bundle-size',
                component: ComponentCreator('/optimization/bundle-size', '3c3'),
                exact: true,
                sidebar: "guide"
              },
              {
                path: '/optimization/ci',
                component: ComponentCreator('/optimization/ci', '14c'),
                exact: true,
                sidebar: "guide"
              },
              {
                path: '/troubleshooting/common-issues',
                component: ComponentCreator('/troubleshooting/common-issues', 'fc6'),
                exact: true,
                sidebar: "guide"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
