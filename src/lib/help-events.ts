// One floating "Help" button opens the assistant chat or the AI report form
// through these window events, so only one button sits on screen.
const OPEN_PIP = "xplania:open-pip";
const OPEN_REPORT = "xplania:open-report-ai";

/** Pages where the assistant chat is not offered. */
export const PIP_HIDDEN_ROUTES = ["/auth", "/onboarding", "/carnet/", "/carnet", "/guide-budget"];
export const isPipHidden = (pathname: string) => PIP_HIDDEN_ROUTES.some((p) => pathname.startsWith(p));

/** Pages with their own specialised assistant: "Aide" opens it instead of the general one. */
export const TOOL_PIP_ROUTES = ["/guide-visa", "/guide-valise"];
export const hasToolPip = (pathname: string) => TOOL_PIP_ROUTES.some((p) => pathname.startsWith(p));

export const openPipChat = () => window.dispatchEvent(new Event(OPEN_PIP));
export const openReportAi = () => window.dispatchEvent(new Event(OPEN_REPORT));

const listen = (name: string) => (cb: () => void) => {
  window.addEventListener(name, cb);
  return () => window.removeEventListener(name, cb);
};
export const onOpenPipChat = listen(OPEN_PIP);
export const onOpenReportAi = listen(OPEN_REPORT);
