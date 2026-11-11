/**
 * Knight Theme Responsive ASCII Title Formatter
 * Deterministically wraps project titles into monospace ASCII grid lines
 * and calculates exact CSS scale variables (--kd, --ld, --km, --lm)
 * matching the authentic Martian Mono character cell ratio:
 *   --k = (maxChars * 0.66 + 0.06)
 *   --l = lineCount
 */

export interface FormattedAsciiTitle {
  desktopLines: string[];
  mobileLines: string[];
  kd: string;
  ld: number;
  km: string;
  lm: number;
}

/**
 * Splits a title string into balanced lines adhering to target character limits,
 * preserving hyphens, underscores, numbers, and Unicode / Vietnamese characters.
 */
export function splitTitleIntoLines(title: string, targetMax: number): string[] {
  if (!title) return ['PROJECT'];
  const upper = title.toUpperCase().trim();
  const charCount = [...upper].length;
  if (charCount <= targetMax) {
    return [upper];
  }

  // Tokenize preserving delimiter attachments:
  // e.g. 'ansible-airgap-k8s' -> ['ANSIBLE-', 'AIRGAP-', 'K8S']
  // e.g. 'S3 Bucket Crud' -> ['S3 ', 'BUCKET ', 'CRUD']
  const tokens: string[] = [];
  const regex = /([^\s\-_]+[\s\-_]*|[\s\-_]+)/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(upper)) !== null) {
    if (m[0]) tokens.push(m[0]);
  }

  const lines: string[] = [];
  let cur = '';

  for (const tok of tokens) {
    const candidate = cur ? cur + tok : tok;
    const candidateLen = [...candidate.trim()].length;

    if (!cur) {
      if (candidateLen <= targetMax) {
        cur = tok;
      } else {
        // Token alone exceeds target, chunk deterministically
        const chars = [...tok];
        for (let i = 0; i < chars.length; i += targetMax) {
          lines.push(chars.slice(i, i + targetMax).join(''));
        }
      }
    } else {
      if (candidateLen <= targetMax) {
        cur = candidate;
      } else {
        lines.push(cur.trim());
        cur = tok;
      }
    }
  }

  if (cur && cur.trim()) {
    lines.push(cur.trim());
  }

  return lines.length ? lines : [upper];
}

/**
 * Formats any project title for responsive ASCII rendering across Desktop and Mobile viewports
 */
export function formatKnightAsciiTitle(title: string): FormattedAsciiTitle {
  const cleanTitle = (title || 'PROJECT').trim();

  // Desktop viewport: target ~12-14 characters per line
  const desktopLines = splitTitleIntoLines(cleanTitle, 13);
  const maxDesktopChars = Math.max(1, ...desktopLines.map((l) => [...l].length));
  const kd = (maxDesktopChars * 0.66 + 0.06).toFixed(3);
  const ld = desktopLines.length;

  // Mobile viewport: target ~7-9 characters per line
  const mobileLines = splitTitleIntoLines(cleanTitle, 8);
  const maxMobileChars = Math.max(1, ...mobileLines.map((l) => [...l].length));
  const km = (maxMobileChars * 0.66 + 0.06).toFixed(3);
  const lm = mobileLines.length;

  return {
    desktopLines,
    mobileLines,
    kd,
    ld,
    km,
    lm,
  };
}
