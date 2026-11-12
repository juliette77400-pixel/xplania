/** Claim a rendered step synchronously, so two events in one frame advance only once. */
export function claimPrepTransition(lock: { current: number | null }, step: number): boolean {
  if (lock.current === step) return false;
  lock.current = step;
  return true;
}