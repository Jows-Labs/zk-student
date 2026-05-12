import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/zk-student/__docusaurus/debug',
    component: ComponentCreator('/zk-student/__docusaurus/debug', '1b8'),
    exact: true
  },
  {
    path: '/zk-student/__docusaurus/debug/config',
    component: ComponentCreator('/zk-student/__docusaurus/debug/config', '88e'),
    exact: true
  },
  {
    path: '/zk-student/__docusaurus/debug/content',
    component: ComponentCreator('/zk-student/__docusaurus/debug/content', '7bd'),
    exact: true
  },
  {
    path: '/zk-student/__docusaurus/debug/globalData',
    component: ComponentCreator('/zk-student/__docusaurus/debug/globalData', '043'),
    exact: true
  },
  {
    path: '/zk-student/__docusaurus/debug/metadata',
    component: ComponentCreator('/zk-student/__docusaurus/debug/metadata', '99a'),
    exact: true
  },
  {
    path: '/zk-student/__docusaurus/debug/registry',
    component: ComponentCreator('/zk-student/__docusaurus/debug/registry', '3f2'),
    exact: true
  },
  {
    path: '/zk-student/__docusaurus/debug/routes',
    component: ComponentCreator('/zk-student/__docusaurus/debug/routes', 'a69'),
    exact: true
  },
  {
    path: '/zk-student/',
    component: ComponentCreator('/zk-student/', 'add'),
    routes: [
      {
        path: '/zk-student/',
        component: ComponentCreator('/zk-student/', 'b44'),
        routes: [
          {
            path: '/zk-student/',
            component: ComponentCreator('/zk-student/', 'd42'),
            routes: [
              {
                path: '/zk-student/how-it-works',
                component: ComponentCreator('/zk-student/how-it-works', 'f6c'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/zk-student/integration',
                component: ComponentCreator('/zk-student/integration', '3ee'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/zk-student/protocol',
                component: ComponentCreator('/zk-student/protocol', '378'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/zk-student/prover-api',
                component: ComponentCreator('/zk-student/prover-api', 'ac1'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/zk-student/trust-model',
                component: ComponentCreator('/zk-student/trust-model', '22f'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/zk-student/',
                component: ComponentCreator('/zk-student/', '9f9'),
                exact: true,
                sidebar: "docs"
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
