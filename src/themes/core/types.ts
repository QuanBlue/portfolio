/**
 * Central Theme System Types
 * Defines the contract for all themes, settings, and registries.
 */

export type ThemeId = 'ascii' | 'knight' | 'editorial' | 'forkfolio';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  previewImage?: string;
  supportsColorMode?: boolean;
  defaultColorMode?: 'dark' | 'light';
  isDefault?: boolean;
}

export interface AppearanceSettings {
  activeTheme: ThemeId;
  colorMode?: 'light' | 'dark' | 'system';
}

export interface ResolvedTheme {
  theme: ThemeDefinition;
  isFallback: boolean;
  source: 'url-param' | 'local-storage' | 'remote-settings' | 'build-default' | 'fallback';
}
