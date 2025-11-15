## 1. Foundation
- [ ] 1.1 Document target React Native, `react-native-svg`, and React Native Web versions to support.
- [ ] 1.2 Configure Yarn Workspaces and Turborepo with linting, formatting, and testing baselines.
- [ ] 1.3 Scaffold package directories and shared configuration (`tsconfig`, `eslint`, release tooling).

## 2. Icon Data Pipeline
- [ ] 2.1 Implement `@react-native-iconify/loader` CLI for ingesting Iconify JSON and custom collections.
- [ ] 2.2 Integrate SVGR (`--native`) and SVGO to generate typed SVG modules and union types.
- [ ] 2.3 Add CI checks ensuring generated artifacts stay in sync with configuration.

## 3. Component & Bundler Integrations
- [ ] 3.1 Build `<Iconify />` component with prop normalization and platform-safe rendering.
- [ ] 3.2 Create Metro plugin with configuration options (`icons`, `collections`, `customCollections`) and verify with sample app.
- [ ] 3.3 Ship optional Babel transform leveraging shared loader utilities and document how it improves bundle trimming.

## 4. Documentation & Releases
- [ ] 4.1 Launch Docusaurus docs covering installation paths, bundle optimization, and customization.
- [ ] 4.2 Provide README badges, contribution templates, and GitHub issue forms.
- [ ] 4.3 Configure Changesets-driven release workflows targeting npm packages.

