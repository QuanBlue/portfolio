import { describe, it, expect } from 'vitest';
import {
  getSessionRole,
  isOwnerSession,
  getSessionLabel,
  OWNER_EMAIL,
  OWNER_GITHUB,
} from '../src/lib/supabase';
import type { Session } from '@supabase/supabase-js';

describe('Admin Authentication & Session Roles', () => {
  it('identifies unauthenticated visitor when session is null', () => {
    expect(getSessionRole(null)).toBeNull();
    expect(isOwnerSession(null)).toBe(false);
    expect(getSessionLabel(null)).toBe('');
  });

  it('identifies repo owner (ROOT) via GitHub metadata or handle', () => {
    const rootSession = {
      user: {
        id: 'user-root',
        email: 'some-other-email@test.com',
        user_metadata: {
          user_name: OWNER_GITHUB,
        },
      },
    } as unknown as Session;

    expect(getSessionRole(rootSession)).toBe('root');
    expect(isOwnerSession(rootSession)).toBe(true);
    expect(getSessionLabel(rootSession)).toBe(`@${OWNER_GITHUB} · ROOT`);
  });

  it('identifies portfolio owner (OWNER) via registered owner email', () => {
    const ownerSession = {
      user: {
        id: 'user-owner',
        email: OWNER_EMAIL,
        user_metadata: {},
      },
    } as unknown as Session;

    expect(getSessionRole(ownerSession)).toBe('owner');
    expect(isOwnerSession(ownerSession)).toBe(true);
    expect(getSessionLabel(ownerSession)).toBe(`${OWNER_EMAIL} · OWNER`);
  });

  it('rejects unauthorized guest users', () => {
    const guestSession = {
      user: {
        id: 'user-guest',
        email: 'random-stranger@gmail.com',
        user_metadata: {
          user_name: 'stranger123',
        },
      },
    } as unknown as Session;

    expect(getSessionRole(guestSession)).toBe('guest');
    expect(isOwnerSession(guestSession)).toBe(false);
    expect(getSessionLabel(guestSession)).toBe('@stranger123');
  });
});
