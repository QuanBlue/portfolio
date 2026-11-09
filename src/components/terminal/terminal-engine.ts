import type { PortfolioData } from '../../data/portfolio';

export interface TerminalOutputLine {
  text: string;
  type?: 'default' | 'success' | 'error' | 'info' | 'prompt' | 'ascii' | 'dim';
  isHtml?: boolean;
}

export type TerminalOutput = TerminalOutputLine[];

export interface CommandContext {
  portfolioData: PortfolioData;
  navigate?: (url: string) => void;
  openModal?: (id: string) => void;
  clearTerminal?: () => void;
  history: string[];
}

export interface TerminalCommand {
  name: string;
  description: string;
  usage?: string;
  execute: (args: string[], context: CommandContext) => TerminalOutput | Promise<TerminalOutput>;
}

export const COMMAND_LIST: Record<string, TerminalCommand> = {
  help: {
    name: 'help',
    description: 'List all available terminal commands',
    execute: (_args, _ctx) => {
      const lines: TerminalOutput = [
        { text: 'DevOps System Shell (v1.0.4) - Available Commands:', type: 'info' },
        { text: '---------------------------------------------------', type: 'dim' },
      ];

      Object.values(COMMAND_LIST).forEach((cmd) => {
        lines.push({
          text: `  ${cmd.name.padEnd(12)} - ${cmd.description}`,
          type: 'default',
        });
      });

      lines.push(
        { text: '---------------------------------------------------', type: 'dim' },
        { text: 'Tip: Use [Tab] to autocomplete, [Up/Down] arrows for history.', type: 'dim' }
      );
      return lines;
    },
  },

  whoami: {
    name: 'whoami',
    description: 'Display professional identity',
    execute: (_args, { portfolioData }) => [
      { text: `${portfolioData.identity.name}`, type: 'success' },
      { text: `Role:     ${portfolioData.identity.role}`, type: 'default' },
      { text: `Node:     ${portfolioData.identity.node}`, type: 'default' },
      { text: `Location: ${portfolioData.identity.location}`, type: 'default' },
    ],
  },

  about: {
    name: 'about',
    description: 'Display professional introduction and engineering philosophy',
    execute: (_args, { portfolioData }) => [
      { text: `[SYS.BIO] ${portfolioData.identity.name} - ${portfolioData.identity.role}`, type: 'info' },
      { text: portfolioData.identity.bio, type: 'default' },
      { text: 'Infrastructure as Code | Zero-Downtime Releases | Observability First', type: 'success' },
    ],
  },

  skills: {
    name: 'skills',
    description: 'Display running modules and technical competencies',
    execute: (_args, { portfolioData }) => {
      const lines: TerminalOutput = [
        { text: `Active Modules [${portfolioData.skills.length} Loaded]:`, type: 'info' },
      ];
      portfolioData.skills.forEach((s) => {
        lines.push({
          text: `  ${s.tag.padEnd(16)} ${s.name.padEnd(18)} [${s.status}]`,
          type: s.status === 'ACTIVE' ? 'success' : 'info',
        });
      });
      return lines;
    },
  },

  projects: {
    name: 'projects',
    description: 'Display featured production projects and repositories',
    execute: (_args, { portfolioData }) => {
      const lines: TerminalOutput = [
        { text: 'Production Services & Repositories:', type: 'info' },
      ];
      portfolioData.projects.forEach((p) => {
        lines.push(
          { text: `* ${p.title} [${p.status}]`, type: 'success' },
          { text: `  Description: ${p.shortDesc}`, type: 'default' },
          { text: `  Tech Stack:  ${p.tags.join(', ')}`, type: 'dim' },
          { text: `  Repository:  ${p.link}`, type: 'info' }
        );
      });
      return lines;
    },
  },

  experience: {
    name: 'experience',
    description: 'Display professional career milestones',
    execute: (_args, { portfolioData }) => {
      const lines: TerminalOutput = [
        { text: 'Professional Experience History:', type: 'info' },
      ];
      portfolioData.experience.forEach((e) => {
        lines.push(
          { text: `> ${e.role} @ ${e.company} (${e.period})`, type: 'success' },
          ...e.bullets.map((b) => ({ text: `  - ${b}`, type: 'default' as const })),
          { text: `  Tags: ${e.tags.join(', ')}`, type: 'dim' }
        );
      });
      return lines;
    },
  },

  contact: {
    name: 'contact',
    description: 'Display contact information and communication channels',
    execute: (_args, { portfolioData }) => [
      { text: 'Communication Channels:', type: 'info' },
      { text: `  Email:    ${portfolioData.identity.email}`, type: 'default' },
      { text: `  LinkedIn: ${portfolioData.identity.linkedin.url}`, type: 'default' },
      { text: `  GitHub:   ${portfolioData.identity.github.url}`, type: 'default' },
      { text: `  Location: ${portfolioData.identity.location}`, type: 'default' },
    ],
  },

  github: {
    name: 'github',
    description: 'Open configured GitHub profile',
    execute: (_args, { portfolioData }) => {
      if (typeof window !== 'undefined') {
        window.open(portfolioData.identity.github.url, '_blank', 'noopener,noreferrer');
      }
      return [
        { text: `Opening ${portfolioData.identity.github.url} in a new tab...`, type: 'success' },
      ];
    },
  },

  blog: {
    name: 'blog',
    description: 'Navigate to technical blog (/blog)',
    execute: (_args, { navigate }) => {
      if (navigate) {
        navigate('/blog');
      } else if (typeof window !== 'undefined') {
        window.location.href = '/blog';
      }
      return [
        { text: 'Navigating to /blog directory...', type: 'success' },
      ];
    },
  },

  clear: {
    name: 'clear',
    description: 'Clear the terminal buffer',
    execute: (_args, { clearTerminal }) => {
      if (clearTerminal) clearTerminal();
      return [];
    },
  },

  history: {
    name: 'history',
    description: 'Display command execution history',
    execute: (_args, { history }) => {
      if (history.length === 0) {
        return [{ text: 'No command history recorded yet.', type: 'dim' }];
      }
      return history.map((cmd, idx) => ({
        text: `  ${(idx + 1).toString().padStart(3, ' ')}  ${cmd}`,
        type: 'default',
      }));
    },
  },

  neofetch: {
    name: 'neofetch',
    description: 'Display a stylized ASCII profile summary',
    execute: (_args, { portfolioData }) => {
      const art = [
        '        .--.',
        '       |o_o |       ntquan@devops-engineer',
        '       |:_/ |       ----------------------',
        '      //   \\ \\      OS: Ubuntu Linux / Alpine Edge',
        '     (|     | )     Host: HCM-VNM-01 [Multi-Zone]',
        '    /\'\\_   _/`\\     Kernel: 6.8.0-devops-generic',
        '    \\___)=(___/     Uptime: 99.9% SLA Online',
        '                    Shell: Astro Term v1.0.4',
        '                    Role: ' + portfolioData.identity.role,
        '                    Target: ' + portfolioData.identity.name,
        '                    Packages: k8s, docker, ansible, prometheus',
        '                    Status: [CLUSTER ONLINE]',
      ];

      return art.map((line) => ({ text: line, type: 'ascii' }));
    },
  },
};

/**
 * Autocomplete matching algorithm
 */
export function getAutocompleteMatch(input: string, commands: string[] = Object.keys(COMMAND_LIST)): {
  match?: string;
  suggestions: string[];
} {
  const trimmed = input.trim();
  if (!trimmed) {
    return { suggestions: commands };
  }

  const matching = commands.filter((cmd) => cmd.startsWith(trimmed.toLowerCase()));

  if (matching.length === 1) {
    return { match: matching[0], suggestions: matching };
  }

  return { suggestions: matching };
}

/**
 * Simple Levenshtein distance for close match command suggestions
 */
export function getClosestCommand(input: string, commands: string[] = Object.keys(COMMAND_LIST)): string | null {
  const clean = input.trim().toLowerCase();
  if (!clean) return null;

  let closest: string | null = null;
  let minDistance = 3; // Allow distance up to 2

  for (const cmd of commands) {
    const dist = levenshteinDistance(clean, cmd);
    if (dist < minDistance) {
      minDistance = dist;
      closest = cmd;
    }
  }

  return closest;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Command History Manager
 */
export class CommandHistoryManager {
  private history: string[] = [];
  private cursor = -1;
  private tempBuffer = '';

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  private maxSize: number;

  push(cmd: string): void {
    const trimmed = cmd.trim();
    if (!trimmed) return;
    // Don't duplicate consecutive identical commands
    if (this.history[this.history.length - 1] !== trimmed) {
      this.history.push(trimmed);
      if (this.history.length > this.maxSize) {
        this.history.shift();
      }
    }
    this.cursor = this.history.length;
  }

  navigateUp(currentInput: string): string {
    if (this.history.length === 0) return currentInput;
    if (this.cursor === this.history.length) {
      this.tempBuffer = currentInput;
    }
    if (this.cursor > 0) {
      this.cursor--;
      return this.history[this.cursor];
    }
    return this.history[0];
  }

  navigateDown(): string {
    if (this.history.length === 0) return '';
    if (this.cursor < this.history.length - 1) {
      this.cursor++;
      return this.history[this.cursor];
    }
    this.cursor = this.history.length;
    return this.tempBuffer;
  }

  getHistory(): string[] {
    return [...this.history];
  }

  resetCursor(): void {
    this.cursor = this.history.length;
    this.tempBuffer = '';
  }
}
