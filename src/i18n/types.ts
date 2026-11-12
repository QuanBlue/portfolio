/**
 * Internationalization (i18n) Type Definitions
 * Shared types for locale keys, dictionaries, and database-level content localization.
 */

export type Locale = 'en' | 'vi';

export type LocalizedString = string | { en: string; vi?: string };

export interface Translations {
  nav: {
    about: string;
    experience: string;
    education: string;
    certifications?: string;
    skills: string;
    projects: string;
    contact: string;
    admin: string;
    blog: string;
    gallery: string;
  };
  hero: {
    greeting: string;
    role: string;
    location: string;
    downloadCv: string;
    contactMe: string;
    statusOnline: string;
    exploreWork: string;
  };
  about: {
    heading: string;
    lead: string;
    locationLabel: string;
    githubLabel: string;
    contactLabel: string;
    whoami: string;
  };
  experience: {
    heading: string;
    current: string;
    present: string;
    empty: string;
  };
  education: {
    heading: string;
    certsHeading: string;
    empty: string;
  };
  certifications?: {
    heading: string;
    empty: string;
    verify: string;
    credentialId: string;
  };
  skills: {
    heading: string;
    empty: string;
  };
  projects: {
    heading: string;
    viewProject: string;
    viewSource: string;
    allProjects: string;
    moreWork: string;
    empty: string;
  };
  activity?: {
    heading: string;
    contributions: string;
    activeDays: string;
    longestStreak: string;
    busiestDay: string;
    lastUpdated: string;
    unavailable: string;
    disabled: string;
    accountMismatch: string;
    noContributions: string;
    contributionSingular: string;
    contributionPlural: string;
    daySingular: string;
    dayPlural: string;
    snapshotLabel: string;
    lessLabel: string;
    moreLabel: string;
  };
  contact: {
    heading: string;
    lead: string;
    notePrompt: string;
    nameLabel: string;
    emailLabel: string;
    messageLabel: string;
    namePlaceholder: string;
    emailPlaceholder: string;
    messagePlaceholder: string;
    sendButton: string;
    sendingButton: string;
    successMessage: string;
  };
  footer: {
    copyright: string;
    sourceCode: string;
    backToTop: string;
  };
  common: {
    lang: string;
    langEn: string;
    langVi: string;
    theme: string;
    dark: string;
    light: string;
    backToHome: string;
    adminSettings: string;
    recordsFound: string;
  };
}
