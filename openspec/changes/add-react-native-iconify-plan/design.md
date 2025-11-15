## Context
react-native-iconify targets a universal icon workflow inspired by Monicon’s package suite and Metro plugin guidance while staying React Native first. The project must support iOS, Android, and web (via React Native Web) with predictable bundle sizing and typed icon authoring. Icon data originates from Iconify JSON sets and optional custom collections stored locally or remotely.

## Goals / Non-Goals
- Goals: ship a maintainable monorepo, expose a single `<Iconify />` component API, generate typed icon data, and integrate Metro tooling that limits icons to those declared by the developer.
- Goals: document installation, configuration, and customization paths; automate releases with semantic versioning; provide community channels and support assets.
- Non-Goals: ship a standalone icon explorer (linking to existing explorers is sufficient), generate native modules, or bundle entire icon collections by default.

## Decisions
- Decision: Use Yarn Workspaces with Turborepo to manage packages `@react-native-iconify/native`, `@react-native-iconify/metro`, `@react-native-iconify/loader`, optional transform tooling such as `@react-native-iconify/babel-plugin`, and shared utilities under `packages/shared`. This mirrors the modular approach recommended in Monicon’s architecture and keeps build pipelines isolated across targets.
- Decision: Implement icon rendering through `react-native-svg` on native platforms and `react-native-svg-web` (or the equivalent alias) on web. The `<Iconify />` component will normalize props (`name`, `size`, `color`, `strokeWidth`, `rotate`, `flip`, `accessibilityLabel`) and resolve icon data from generated modules to ensure parity with Monicon’s documented API surface.
- Decision: Generate icon modules using SVGR with the `--native` flag and SVGO optimization, triggered via a `@react-native-iconify/loader` CLI that consumes Iconify JSON packages and custom collections. The generator will emit TypeScript types (icon union, prop interfaces) stored under `.iconify/` and surfaced through package exports.
- Decision: Provide a Metro plugin that accepts `icons`, `collections`, and `customCollections` options, pre-bundling only declared icons to mirror Monicon’s Metro behavior. Optional Babel transform hooks will translate `<Iconify name="set:icon" />` calls into direct imports for advanced users without introducing dedicated Webpack/Vite plugins.
- Decision: Maintain documentation with a Docusaurus site in `apps/docs`, covering installation for bare React Native, Expo, and web targets, with bundle-size playbooks, troubleshooting, and dynamic import strategies. Contribution templates, a changelog powered by Changesets, and GitHub workflows will reinforce community engagement.

## Risks / Trade-offs
- Metro plugin complexity introduces risk of regressions across Metro versions; mitigation includes CI matrix tests against supported React Native releases and fallback guidance for users who cannot enable the plugin.
- Generating TypeScript unions for large icon sets may increase type-check times; mitigation includes recommending scoped icons per project and caching generated artifacts.
- Supporting both Metro and web bundlers increases maintenance overhead; mitigation involves sharing core logic via `@react-native-iconify/loader` and covering plugin behaviors with integration tests.

## Migration Plan
- Bootstrap repository structure and shared config templates.
- Deliver loader + icon generation first to unblock component development.
- Implement Metro plugin and validate with sample app before iterating on optional Babel transform behavior.
- Finalize documentation and release automation once packages have stable APIs.

## Open Questions
- Should we bundle example apps (Expo, React Native CLI) inside the monorepo or keep them in separate repos?
- What minimum React Native and `react-native-svg` versions will we officially support, and how far back should compatibility testing extend?

