import type { IconSource } from '@react-native-iconify/shared';

export type IconRegistryModule = {
  getIcon(name: string): IconSource | undefined;
};

const DEFAULT_REGISTRY_SPECS = ['@react-native-iconify/icons', '../../.iconify/icons'];

let registry: IconRegistryModule | null = null;

export function setIconRegistry(module: IconRegistryModule | null): void {
  registry = module;
}

export function resolveIconByName(name: string): IconSource | null {
  const module = registry ?? loadDefaultRegistry();
  if (!module) {
    return null;
  }

  const icon = module.getIcon(name);
  return icon ?? null;
}

function loadDefaultRegistry(): IconRegistryModule | null {
  if (registry) {
    return registry;
  }

  for (const specifier of DEFAULT_REGISTRY_SPECS) {
    try {
      const candidate = require(specifier) as IconRegistryModule;
      if (candidate && typeof candidate.getIcon === 'function') {
        registry = candidate;
        return registry;
      }
    } catch {
      continue;
    }
  }

  return null;
}

