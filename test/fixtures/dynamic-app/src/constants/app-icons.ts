// No icon component is imported here - only the literal scan can see this file.
export const TAB_ICONS = {
  profile: "mdi:account-circle",
  home: "mdi:home-variant",
};

// "extraPrefixes": ["acme"] admits a self-hosted collection.
export const BRAND_ICON = "acme:logo";

// Lookalike strings that must never be bundled: shape or prefix validation fails.
export const OPENING_HOURS = "12:30";
export const DEV_SERVER = "localhost:8081";
export const I18N_KEY = "common:back";

// A commented-out icon must not be bundled either: "mdi:ghost"
