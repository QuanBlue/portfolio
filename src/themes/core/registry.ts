import type { ThemeDefinition, ThemeId } from './types';

export const DEFAULT_THEME_ID: ThemeId = 'ascii';

const THEME_REGISTRY = new Map<ThemeId, ThemeDefinition>();

export const BUILTIN_THEMES: ThemeDefinition[] = [
  {
    id: 'ascii',
    name: 'Forkfolio ASCII',
    description: 'Authentic ASCII character art with typewriter matrix cyber-banner and terminal aesthetic.',
    previewImage: '/images/themes/ascii-preview.png',
    supportsColorMode: false,
    defaultColorMode: 'dark',
    isDefault: true,
  },
  {
    id: 'knight',
    name: 'Knight',
    description: 'High-fidelity minimalist developer portfolio matching forkfolio.dev with Martian Mono typography, GitHub commit calendar, and procedural plate covers.',
    previewImage: '/images/themes/knight-preview.png',
    supportsColorMode: false,
    defaultColorMode: 'dark',
    isDefault: false,
  },
  {
    id: 'editorial',
    name: 'DevOps Editorial',
    description: 'DevOps engineering magazine with 3D book-opening journey timeline, Jenkins pipeline & interactive terminal.',
    previewImage: '/images/themes/editorial-preview.png',
    supportsColorMode: true,
    defaultColorMode: 'dark',
    isDefault: false,
  },
  {
    id: 'forkfolio',
    name: 'Forkfolio Modern Mono',
    description: 'Minimalist clean monospace layout with telemetry cards and prominent crosshair frames.',
    previewImage: '/images/themes/forkfolio-preview.png',
    supportsColorMode: true,
    defaultColorMode: 'dark',
    isDefault: false,
  },
];

// Seed registry
for (const theme of BUILTIN_THEMES) {
  THEME_REGISTRY.set(theme.id, theme);
}

export function registerTheme(theme: ThemeDefinition): void {
  THEME_REGISTRY.set(theme.id, theme);
}

export function getTheme(id: string | null | undefined): ThemeDefinition | undefined {
  if (!id) return undefined;
  return THEME_REGISTRY.get(id as ThemeId);
}

export function hasTheme(id: string | null | undefined): boolean {
  if (!id) return false;
  return THEME_REGISTRY.has(id as ThemeId);
}

export function getAllThemes(): ThemeDefinition[] {
  return Array.from(THEME_REGISTRY.values());
}

export function getDefaultTheme(): ThemeDefinition {
  return THEME_REGISTRY.get(DEFAULT_THEME_ID) ?? BUILTIN_THEMES[0];
}
