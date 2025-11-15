## ADDED Requirements
### Requirement: Metro Plugin Configuration
The `@react-native-iconify/metro` package SHALL expose a `withIconify(config, options)` helper that injects icon modules during Metro bundling, accepting `icons`, `collections`, and `customCollections` arrays to limit bundled assets.

#### Scenario: Limiting icons in Metro
- **WHEN** a developer registers the plugin in `metro.config.js` with `icons: ['lucide:badge-check']`
- **THEN** the resulting bundle SHALL only include the specified icon assets and omit unused icons.

### Requirement: Babel Transform & Tree Shaking Guidance
The project SHALL ship an optional Babel transform that rewrites `<Iconify name="set:icon" />` usage into direct imports and publish documentation on bundle analysis, dead-code elimination, and dynamic loading strategies.

#### Scenario: Applying the transform
- **WHEN** a developer enables the Babel plugin in `babel.config.js`
- **THEN** compilation SHALL replace component calls with explicit icon imports, maintaining prop semantics and enabling downstream tree shaking.

