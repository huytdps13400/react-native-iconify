const assert = require('node:assert/strict');
const path = require('node:path');
const { afterEach, beforeEach, test } = require('node:test');

const {
  scanProject,
  extractIconNamesFromComponent,
  matchesIconGlob,
} = require('../scripts/scan-icons.js');

const FIXTURES = path.join(__dirname, 'fixtures');
const originalLog = console.log;

beforeEach(() => {
  console.log = () => {};
});

afterEach(() => {
  console.log = originalLog;
});

test('finds icons used through a wrapper component', () => {
  const result = scanProject(path.join(FIXTURES, 'wrapper-app'));

  assert.deepEqual(result.wrapperComponents, ['AppIcon', 'BadgeIcon', 'CardIcon']);
  assert.deepEqual(result.icons, [
    'feather:settings',
    'ion:arrow-back',
    'mdi:account',
    'mdi:bell',
    'mdi:bookmark',
    'mdi:card-account-details',
    'mdi:heart',
    'mdi:home',
    'mdi:refresh',
    'mdi:shield',
    'mdi:star'
  ]);
  assert.deepEqual(result.unresolved, []);
});

test('keeps detecting direct IconifyIcon usage', () => {
  const result = scanProject(path.join(FIXTURES, 'wrapper-app'));

  // src/screens/DirectScreen.tsx
  assert.ok(result.icons.includes('mdi:home'));
  assert.ok(result.icons.includes('mdi:account'));
  assert.ok(result.icons.includes('mdi:bell'));
  // src/screens/CallbackScreen.tsx - `name` after a prop containing ">"
  assert.ok(result.icons.includes('mdi:refresh'));
  assert.equal(result.stats.filesWithImport, 4);
});

test('the reporter wrapper is traced despite the style array and prop spread', () => {
  const result = scanProject(path.join(FIXTURES, 'wrapper-app'));

  assert.ok(result.icons.includes('mdi:heart'));
  assert.ok(result.icons.includes('ion:arrow-back'));
  assert.ok(result.icons.includes('feather:settings'));
});

test('follows a wrapper of a wrapper and a renamed default import', () => {
  const result = scanProject(path.join(FIXTURES, 'wrapper-app'));

  // CardIcon -> AppIcon -> IconifyIcon
  assert.ok(result.icons.includes('mdi:card-account-details'));
  // import Glyph from "@/components/AppIcon"
  assert.ok(result.icons.includes('mdi:star'));
  // import { AppIcon } from "../components" - re-exported through a barrel file
  assert.ok(result.icons.includes('mdi:bookmark'));
  // BadgeIcon is only ever used as <Badge/>, and must not be flagged as unresolvable
  assert.ok(result.icons.includes('mdi:shield'));
  assert.deepEqual(result.unresolved, []);
});

test('reports icon names it cannot resolve instead of dropping them silently', () => {
  const result = scanProject(path.join(FIXTURES, 'dynamic-app'));

  const reported = result.unresolved.map(
    (usage) => `${usage.file}:${usage.line} ${usage.component} ${usage.expression}`
  );

  assert.deepEqual(reported, [
    'src/screens/TemplateScreen.tsx:4 IconifyIcon {`mdi:${kind}`}',
    'src/screens/TranslatedScreen.tsx:5 IconifyIcon {t("common:back")}'
  ]);
  assert.equal(result.stats.unresolvedUsages, 2);
  assert.ok(!result.icons.includes('common:back'));
});

test('scrapes validated literals from dynamic expressions', () => {
  const result = scanProject(path.join(FIXTURES, 'dynamic-app'));

  // name={active ? "mdi:check" : "mdi:close"} - both branches bundled
  assert.ok(result.icons.includes('mdi:check'));
  assert.ok(result.icons.includes('mdi:close'));
  assert.equal(result.scraped.length, 1);
  assert.equal(result.scraped[0].file, 'src/screens/PickerScreen.tsx');
  assert.deepEqual(result.scraped[0].icons.sort(), ['mdi:check', 'mdi:close']);
  // The DynamicIcon `name={name}` pass-through is satisfied by that call site.
  assert.ok(!result.unresolved.some((usage) => usage.file.includes('DynamicIcon')));
});

test('literal scan finds icons in files nothing imports', () => {
  const result = scanProject(path.join(FIXTURES, 'dynamic-app'));

  assert.ok(result.icons.includes('mdi:account-circle'));
  // "extraPrefixes": ["acme"] admits a self-hosted collection
  assert.ok(result.icons.includes('acme:logo'));
  // "exclude": ["mdi:home-variant"] wins over the literal scan
  assert.ok(!result.icons.includes('mdi:home-variant'));
  assert.deepEqual(
    result.viaLiteralScan.map((entry) => entry.icon),
    ['acme:logo', 'mdi:account-circle']
  );
});

test('literal scan rejects lookalike strings and commented-out icons', () => {
  const result = scanProject(path.join(FIXTURES, 'dynamic-app'));

  // Shape or prefix validation fails for all of these
  assert.ok(!result.icons.includes('12:30'));
  assert.ok(!result.icons.includes('localhost:8081'));
  assert.ok(!result.icons.includes('common:back'));
  // "mdi:ghost" appears only inside a comment
  assert.ok(!result.icons.includes('mdi:ghost'));
});

test('reports dynamic icon name construction with a glob suggestion', () => {
  const result = scanProject(path.join(FIXTURES, 'dynamic-app'));

  assert.equal(result.dynamicConstructions.length, 1);
  assert.equal(result.dynamicConstructions[0].file, 'src/screens/TemplateScreen.tsx');
  assert.equal(result.dynamicConstructions[0].line, 4);
  assert.equal(result.dynamicConstructions[0].suggestion, 'mdi:*');
});

test('passes safelist globs through for bundle-time expansion', () => {
  const result = scanProject(path.join(FIXTURES, 'dynamic-app'));

  assert.deepEqual(result.iconGlobs, ['mdi:weather-*']);
  assert.ok(!result.icons.includes('mdi:weather-*'));
});

test('strict mode turns the literal tiers off', () => {
  const result = scanProject(path.join(FIXTURES, 'strict-app'));

  assert.deepEqual(result.icons, []);
  assert.equal(result.unresolved.length, 1);
  assert.equal(result.stats.literalScanIcons, 0);
});

test('matchesIconGlob expands stars against the icon-name alphabet', () => {
  assert.ok(matchesIconGlob('mdi:weather-*', 'mdi:weather-sunny'));
  assert.ok(matchesIconGlob('mdi:weather-*', 'mdi:weather-partly-cloudy'));
  assert.ok(!matchesIconGlob('mdi:weather-*', 'mdi:home'));
  assert.ok(!matchesIconGlob('mdi:weather-*', 'lucide:weather-sun'));
  assert.ok(matchesIconGlob('mdi:home', 'mdi:home'));
});

test('honours the package.json escape hatch for components and icons', () => {
  const result = scanProject(path.join(FIXTURES, 'dynamic-app'));

  // "iconify": { "components": ["LegacyIcon"] }
  assert.ok(result.icons.includes('mdi:cog'));
  // "iconify": { "icons": ["mdi:alert"] }
  assert.ok(result.icons.includes('mdi:alert'));
});

test('reads the name prop regardless of its position in the tag', () => {
  assert.deepEqual(
    extractIconNamesFromComponent('<IconifyIcon onPress={() => open()} name="mdi:home" />'),
    ['mdi:home']
  );
  assert.deepEqual(
    extractIconNamesFromComponent('<IconifyIcon name="mdi:home" style={[{ name: "nope" }]} />'),
    ['mdi:home']
  );
  assert.deepEqual(extractIconNamesFromComponent('<IconifyIconGroup name="mdi:home" />'), []);
});
