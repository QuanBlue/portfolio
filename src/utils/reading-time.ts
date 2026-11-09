export function calculateReadingTime(text: string): string {
  const wordsPerMinute = 200;
  // Strip markdown formatting & html tags
  const clean = text
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/[#*`~>-]/g, '')
    .trim();
  const wordCount = clean ? clean.split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  return `${minutes} min read`;
}
