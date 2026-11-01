// Rule for the Visa official summary on screen: a new check that brings no
// summary back (tries used up, AI paused, official pages down) never wipes
// the one the student is already reading. The server marks such an older
// summary as stale and keeps its real check date.
interface WithContent { content: unknown | null }

export function keepPreviousSummary<T extends WithContent>(prev: T | undefined, fresh: T): T {
  if (fresh.content || !prev?.content) return fresh;
  return prev;
}
