## ADDED Requirements
### Requirement: Monorepo Package Layout
The project SHALL organize source code as a Yarn Workspace managed by Turborepo with packages `@react-native-iconify/native`, `@react-native-iconify/metro`, `@react-native-iconify/loader`, optional transform tooling (e.g., `@react-native-iconify/babel-plugin`), and shared utilities under `packages/shared`.

#### Scenario: Repository bootstrap
- **WHEN** maintainers initialize the repository using the documented setup scripts
- **THEN** the workspace SHALL include the defined package directories with linting, testing, and build tooling wired through Turborepo pipelines.

### Requirement: Iconify Component Contract
The `@react-native-iconify/native` package SHALL export a `<Iconify />` component that accepts props `name`, `size`, `color`, `strokeWidth`, `rotate`, `flip`, and `accessibilityLabel`, rendering icons via `react-native-svg` primitives across iOS, Android, and web.

#### Scenario: Rendering a single icon
- **WHEN** a developer imports `<Iconify name="mdi:home" size={24} color="blue" />` in a React Native app
- **THEN** the component SHALL render the expected SVG path using `react-native-svg`, apply the provided props, and remain visually consistent across supported platforms.

### Requirement: Icon Asset Pipeline
The project SHALL generate icon modules and TypeScript declarations from Iconify JSON sets and custom collections, storing artifacts under `.iconify/` and publishing typed entry points for consumers.

#### Scenario: Generating icons from configuration
- **WHEN** a maintainer configures icons via the loader CLI
- **THEN** the build SHALL produce optimized SVG modules, union types for icon names, and updated exports consumable by `@react-native-iconify/native`.

