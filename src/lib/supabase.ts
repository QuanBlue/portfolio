/**
 * Supabase integration. Entirely optional: when PUBLIC_SUPABASE_* are not set the site
 * falls back to build-time data + local browser drafts.
 */
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient, Session } from '@supabase/supabase-js';
import { defaultPortfolioData, type PortfolioData } from '../data/portfolio';
import { ADMIN_PREVIEW_GRANT_KEY } from '../themes/core/resolver';
import { applyAppearance } from '../themes/core/settings';
import type { ThemeId } from '../themes/core/types';

const URL = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;

const TABLE = 'portfolio_content';
const ROW_ID = 'main';
const BUCKET = 'portfolio';

export const isSupabaseConfigured = Boolean(URL && KEY);

let client: SupabaseClient | null = null;
export function getClient(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error('Sign-in is currently unavailable. Please try again later.');
  }
  return (client ??= createClient(URL!, KEY!, { auth: { persistSession: true } }));
}

/** Published content, or null when there is none / the request failed. */
export async function fetchRemote(): Promise<Partial<PortfolioData> | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await getClient().from(TABLE).select('data').eq('id', ROW_ID).maybeSingle();
    if (error) return null;
    return (data?.data as Partial<PortfolioData>) ?? null;
  } catch {
    return null;
  }
}

export function assertAuthorizedAdminSession(session: Session | null): asserts session is Session {
  if (!isOwnerSession(session)) {
    throw new Error('Unauthorized: Authenticated Admin session is required.');
  }
}

export async function publishRemote(content: PortfolioData): Promise<void> {
  const session = await getSession();
  assertAuthorizedAdminSession(session);
  const { error } = await getClient()
    .from(TABLE)
    .upsert({ id: ROW_ID, data: content, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

export async function publishThemeSelectionRemote(
  content: PortfolioData,
  themeId: ThemeId,
): Promise<PortfolioData> {
  const next = applyAppearance(content, { activeTheme: themeId });
  await publishRemote(next);
  return next;
}

/** Upload an image blob and return its public URL. */
export async function uploadImage(
  blob: Blob,
  folder: string,
  opts: { ext?: string; contentType?: string } = {},
): Promise<string> {
  const session = await getSession();
  assertAuthorizedAdminSession(session);
  const ext = opts.ext ?? 'jpg';
  const path = `${folder}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await getClient().storage.from(BUCKET).upload(path, blob, {
    contentType: opts.contentType ?? 'image/jpeg',
    cacheControl: '31536000',
  });
  if (error) throw new Error(error.message);
  return getClient().storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export const OWNER_EMAIL = defaultPortfolioData.identity.email.toLowerCase();
export const OWNER_GITHUB = defaultPortfolioData.identity.github.handle.replace(/^@/, '').toLowerCase();

export type SessionRole = 'root' | 'owner' | 'guest' | null;

function extractGitHubUsername(session: Session | null): string {
  if (!session?.user) return '';
  const meta = session.user.user_metadata ?? {};
  const fromMeta = meta.user_name ?? meta.preferred_username;
  if (fromMeta) return String(fromMeta).toLowerCase();
  const ghIdentity = session.user.identities?.find((id) => id.provider === 'github');
  const idData = ghIdentity?.identity_data ?? {};
  return String(idData.user_name ?? idData.preferred_username ?? '').toLowerCase();
}

export function getSessionRole(session: Session | null): SessionRole {
  if (!session?.user) return null;
  const ghUser = extractGitHubUsername(session);
  if (ghUser && ghUser === OWNER_GITHUB) return 'root';
  const email = session.user.email?.toLowerCase() ?? '';
  if (email === OWNER_EMAIL) return 'owner';
  return 'guest';
}

export function isOwnerSession(session: Session | null): boolean {
  const role = getSessionRole(session);
  return role === 'root' || role === 'owner';
}

export function getSessionLabel(session: Session | null): string {
  if (!session?.user) return '';
  const role = getSessionRole(session);
  const ghUser = extractGitHubUsername(session);
  if (role === 'root') return `@${ghUser} · ROOT`;
  if (role === 'owner') return `${session.user.email ?? 'owner'} · OWNER`;
  return ghUser ? `@${ghUser}` : (session.user.email ?? 'guest');
}

export async function getSession(): Promise<Session | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await getClient().auth.getSession();
  return data.session;
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await getClient().auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

export async function signInWithGitHub(): Promise<void> {
  const redirectTo = `${window.location.origin}/admin`;
  const { error } = await getClient().auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo },
  });
  if (error) throw new Error(error.message);
}

export async function signInWithGoogle(): Promise<void> {
  const redirectTo = `${window.location.origin}/admin`;
  const { error } = await getClient().auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
  if (error) throw new Error(error.message);
}

export async function sendMagicLink(email: string): Promise<void> {
  const emailRedirectTo = `${window.location.origin}/admin`;
  const { error } = await getClient().auth.signInWithOtp({
    email,
    options: { emailRedirectTo, shouldCreateUser: false },
  });
  if (error) throw new Error(error.message);
}

export function onAuthChange(cb: () => void): void {
  if (!isSupabaseConfigured) return;
  getClient().auth.onAuthStateChange(() => cb());
}

export async function signOut(): Promise<void> {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(ADMIN_PREVIEW_GRANT_KEY);
    } catch {}
  }
  if (isSupabaseConfigured) {
    await getClient().auth.signOut();
  }
}