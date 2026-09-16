// Shared hashtag extraction — single source of truth for backend + tests.
// Matches Instagram-style tags: # + letter, then letters/numbers/underscore.
// Returns lowercase deduped tags without '#', max MAX_HASHTAGS_PER_POST.
export const MAX_HASHTAGS_PER_POST = 30;

const TAG_RE = /#(\p{L}[\p{L}\p{N}_]*)/gu;

export function extractHashtags(text: string): string[] {
  if (!text) return [];
  const seen = new Set<string>();
  for (const match of text.matchAll(TAG_RE)) {
    const tag = match[1].toLowerCase();
    if (!seen.has(tag)) seen.add(tag);
    if (seen.size >= MAX_HASHTAGS_PER_POST) break;
  }
  return [...seen];
}
