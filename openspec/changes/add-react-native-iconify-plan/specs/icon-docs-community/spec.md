## ADDED Requirements
### Requirement: Documentation Website
The project SHALL host a documentation site (e.g., Docusaurus) detailing getting started guides, platform-specific setup (bare React Native, Expo, web), icon customization, and troubleshooting.

#### Scenario: Onboarding a new user
- **WHEN** a developer visits the documentation site
- **THEN** they SHALL find sections covering installation, Metro and web configuration, bundle optimization strategies, and code examples for `<Iconify />`.

### Requirement: Publishing & Versioning Process
The repository SHALL adopt Changesets (or equivalent) to manage npm releases for each package, maintain a changelog, and publish packages under the `@react-native-iconify` scope with React and React Native as peer dependencies.

#### Scenario: Cutting a release
- **WHEN** maintainers apply version bumps via Changesets
- **THEN** CI SHALL publish updated packages, update the changelog, and ensure semver tagging stays in sync across the monorepo.

### Requirement: Community Support Assets
The project SHALL supply README badges, contribution guidelines, issue and discussion templates, and links to external icon explorers to foster community engagement.

#### Scenario: Opening a community ticket
- **WHEN** a contributor opens an issue via GitHub
- **THEN** they SHALL be guided by templates that capture environment details, usage context, and reproduction steps, aligning with documented support channels.

