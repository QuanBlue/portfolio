import { describe, it, expect, vi } from 'vitest';
import {
  COMMAND_LIST,
  getAutocompleteMatch,
  getClosestCommand,
  CommandHistoryManager,
} from '../src/components/terminal/terminal-engine';
import { portfolioData } from '../src/data/portfolio';

describe('Terminal Engine Command Registry', () => {
  const dummyContext = {
    portfolioData,
    navigate: vi.fn(),
    openModal: vi.fn(),
    clearTerminal: vi.fn(),
    history: ['whoami', 'skills'],
  };

  it('registers all 12 required commands', () => {
    const requiredCommands = [
      'help',
      'whoami',
      'about',
      'skills',
      'projects',
      'experience',
      'contact',
      'github',
      'blog',
      'clear',
      'history',
      'neofetch',
    ];

    requiredCommands.forEach((cmdName) => {
      expect(COMMAND_LIST).toHaveProperty(cmdName);
      expect(typeof COMMAND_LIST[cmdName].execute).toBe('function');
      expect(COMMAND_LIST[cmdName].description).toBeTruthy();
    });
  });

  it('executes "help" and returns list of all commands', async () => {
    const output = await COMMAND_LIST['help'].execute([], dummyContext);
    expect(output.length).toBeGreaterThan(12);
    const combined = output.map((l) => l.text).join(' ');
    expect(combined).toContain('whoami');
    expect(combined).toContain('skills');
    expect(combined).toContain('projects');
  });

  it('executes "whoami" returning authentic user identity', async () => {
    const output = await COMMAND_LIST['whoami'].execute([], dummyContext);
    const text = output.map((l) => l.text).join(' ');
    expect(text).toContain(portfolioData.identity.name);
    expect(text).toContain(portfolioData.identity.role);
    expect(text).toContain(portfolioData.identity.location);
  });

  it('executes "about" returning authentic summary', async () => {
    const output = await COMMAND_LIST['about'].execute([], dummyContext);
    const text = output.map((l) => l.text).join(' ');
    expect(text).toContain(portfolioData.identity.name);
    expect(text).toContain(portfolioData.identity.bio);
  });

  it('executes "skills" returning all running modules', async () => {
    const output = await COMMAND_LIST['skills'].execute([], dummyContext);
    const text = output.map((l) => l.text).join(' ');
    expect(text).toContain('Kubernetes');
    expect(text).toContain('Docker');
    expect(text).toContain('Ansible');
    expect(text).toContain('Prometheus');
  });

  it('executes "projects" returning all featured projects', async () => {
    const output = await COMMAND_LIST['projects'].execute([], dummyContext);
    const text = output.map((l) => l.text).join(' ');
    expect(text).toContain('ansible-airgap-k8s');
    expect(text).toContain('mern-portfolio');
  });

  it('executes "experience" returning authentic milestones', async () => {
    const output = await COMMAND_LIST['experience'].execute([], dummyContext);
    const text = output.map((l) => l.text).join(' ');
    expect(text).toContain('Viettel');
    expect(text).toContain('Tech Company XYZ');
  });

  it('executes "contact" returning communication channels', async () => {
    const output = await COMMAND_LIST['contact'].execute([], dummyContext);
    const text = output.map((l) => l.text).join(' ');
    expect(text).toContain(portfolioData.identity.email);
    expect(text).toContain(portfolioData.identity.linkedin.url);
    expect(text).toContain(portfolioData.identity.github.url);
  });

  it('executes "history" returning prior commands list', async () => {
    const output = await COMMAND_LIST['history'].execute([], dummyContext);
    expect(output).toHaveLength(2);
    expect(output[0].text).toContain('whoami');
    expect(output[1].text).toContain('skills');
  });

  it('executes "neofetch" returning ASCII summary', async () => {
    const output = await COMMAND_LIST['neofetch'].execute([], dummyContext);
    const text = output.map((l) => l.text).join('\n');
    expect(text).toContain('ntquan@devops-engineer');
    expect(text).toContain(portfolioData.identity.name);
    expect(text).toContain('CLUSTER ONLINE');
  });

  it('executes "clear" and triggers clearTerminal callback', async () => {
    const clearMock = vi.fn();
    const output = await COMMAND_LIST['clear'].execute([], {
      ...dummyContext,
      clearTerminal: clearMock,
    });
    expect(clearMock).toHaveBeenCalledTimes(1);
    expect(output).toEqual([]);
  });

  it('executes "blog" and triggers navigate callback', async () => {
    const navMock = vi.fn();
    const output = await COMMAND_LIST['blog'].execute([], {
      ...dummyContext,
      navigate: navMock,
    });
    expect(navMock).toHaveBeenCalledWith('/blog');
    expect(output[0].text).toContain('/blog');
  });
});

describe('Terminal Autocomplete', () => {
  it('autocompletes exact single prefix match', () => {
    const { match } = getAutocompleteMatch('who');
    expect(match).toBe('whoami');
  });

  it('returns multiple suggestions when prefix matches multiple', () => {
    const { suggestions, match } = getAutocompleteMatch('c');
    expect(match).toBeUndefined();
    expect(suggestions).toContain('contact');
    expect(suggestions).toContain('clear');
  });

  it('returns all commands when input is empty', () => {
    const { suggestions } = getAutocompleteMatch('');
    expect(suggestions.length).toBe(12);
  });
});

describe('Closest Command Matcher (Levenshtein)', () => {
  it('suggests closest command on typos', () => {
    expect(getClosestCommand('whoam')).toBe('whoami');
    expect(getClosestCommand('skils')).toBe('skills');
    expect(getClosestCommand('clearr')).toBe('clear');
  });

  it('returns null for completely unrelated strings', () => {
    expect(getClosestCommand('xyz123456789')).toBeNull();
  });
});

describe('Command History Manager', () => {
  it('navigates through history using Up and Down arrows', () => {
    const manager = new CommandHistoryManager();
    manager.push('help');
    manager.push('whoami');
    manager.push('skills');

    // Arrow Up 1: skills
    expect(manager.navigateUp('')).toBe('skills');
    // Arrow Up 2: whoami
    expect(manager.navigateUp('')).toBe('whoami');
    // Arrow Up 3: help
    expect(manager.navigateUp('')).toBe('help');
    // Arrow Up at top remains at top: help
    expect(manager.navigateUp('')).toBe('help');

    // Arrow Down 1: whoami
    expect(manager.navigateDown()).toBe('whoami');
    // Arrow Down 2: skills
    expect(manager.navigateDown()).toBe('skills');
    // Arrow Down 3: returns buffer
    expect(manager.navigateDown()).toBe('');
  });

  it('does not duplicate consecutive identical commands', () => {
    const manager = new CommandHistoryManager();
    manager.push('help');
    manager.push('help');
    expect(manager.getHistory()).toEqual(['help']);
  });
});
