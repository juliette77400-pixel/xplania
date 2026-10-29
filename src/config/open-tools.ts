// Tools that work without an account (they save in the browser only). Valise
// and Logement keep the student's own data on their account, so they need one.
export const OPEN_TOOL_PATHS = ["/guide-budget", "/guide-visa", "/guide-culture"] as const;
export const isOpenTool = (path: string) => (OPEN_TOOL_PATHS as readonly string[]).includes(path);

// The Budget estimate is computed in the browser (no AI), so visitors build it
// without using a try; signed-in students keep their monthly counter.
export const localGenerationBlocked = (signedIn: boolean, quotaReached: boolean) =>
  signedIn && quotaReached;
export const localGenerationUsesTry = (signedIn: boolean) => signedIn;
