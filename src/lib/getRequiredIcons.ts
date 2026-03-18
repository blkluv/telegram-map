import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Always include these Lucide icons
const DEFAULT_LUCIDE_ICONS = [
  // Icons used as part of site
  'chevron-right', 'chevron-left', 'chevron-up', 'chevron-down', 'link', 'external-link', 'file-text', 'archive'
];

// ESM-compatible __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.resolve(__dirname, '../siteConfig.json');

// Helper to extract icon names by namespace
function extractIcons(config: any) {
  const icons: Record<string, Set<string>> = {};

  function addIcon(icon: string) {
    if (!icon) return;
    // Only include icons with a prefix (e.g. lucide:, logos:, etc)
    const match = icon.match(/^(?<ns>[^:]+):(?<name>.+)$/);
    if (match && match.groups) {
      const ns = match.groups.ns;
      const name = match.groups.name;
      if (!icons[ns]) icons[ns] = new Set();
      icons[ns].add(name);
    }
  }

  // iconLinks
  if (Array.isArray(config.iconLinks)) {
    for (const link of config.iconLinks) {
      addIcon(link.icon);
    }
  }
  // customLinks
  if (Array.isArray(config.customLinks)) {
    for (const link of config.customLinks) {
      addIcon(link.icon);
    }
  }

  // Always add default lucide icons
  if (!icons.lucide) icons.lucide = new Set();
  for (const icon of DEFAULT_LUCIDE_ICONS) {
    icons.lucide.add(icon);
  }
  // Convert sets to arrays
  const result: Record<string, string[]> = {};
  for (const ns in icons) {
    result[ns] = Array.from(icons[ns]);
  }
  return result;
}

// Helper to get all local SVG icons in src/icons as local:icon-name
function getLocalIcons() {
  const iconsDir = path.resolve(__dirname, '../icons');
  let localIcons: string[] = [];
  try {
    const files = fs.readdirSync(iconsDir);
    localIcons = files
      .filter(f => f.endsWith('.svg'))
      .map(f => f.replace(/\.svg$/, ''));
  } catch (e) {
    // icons dir may not exist yet
    localIcons = [];
  }
  return localIcons;
}

// Exported function to get icons
export function getRequiredIcons() {
  const configRaw = fs.readFileSync(CONFIG_PATH, 'utf-8');
  const config = JSON.parse(configRaw);
  const iconsByNs = extractIcons(config);

  // Always include all local icons found in src/icons
  const localIcons = getLocalIcons();
  if (localIcons.length > 0) {
    iconsByNs['local'] = Array.from(new Set([...(iconsByNs['local'] || []), ...localIcons]));
  }
  return iconsByNs;
}

