const assert = require('node:assert/strict');
const path = require('node:path');
const { afterEach, beforeEach, test } = require('node:test');

const { scanProject, extractIconNamesFromComponent } = require('../scripts/scan-icons.js');

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
    'src/components/DynamicIcon.tsx:4 IconifyIcon {name}',
    'src/screens/PickerScreen.tsx:4 DynamicIcon {active ? "mdi:check" : "mdi:close"}'
  ]);
  assert.equal(result.stats.unresolvedUsages, 2);
  assert.ok(!result.icons.includes('mdi:check'));
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
