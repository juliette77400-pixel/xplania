import { describe, expect, it, vi } from "vitest";
import { FEATURE_FLAGS } from "@/config/featureFlags";
import { hasToolPip, isPipHidden, onOpenPipChat, openPipChat } from "./help-events";

describe("masquage de Ping", () => {
  it("désactive le flag unique de l’assistant", () => {
    expect(FEATURE_FLAGS.ENABLE_PING_ASSISTANT).toBe(false);
  });

  it("ne propose aucune entrée Ping, y compris sur les pages outils", () => {
    expect(isPipHidden("/")).toBe(true);
    expect(isPipHidden("/guide-visa")).toBe(true);
    expect(hasToolPip("/guide-visa")).toBe(false);
  });

  it("ne diffuse pas d’ordre d’ouverture du chat", () => {
    const open = vi.fn();
    const stop = onOpenPipChat(open);
    openPipChat();
    expect(open).not.toHaveBeenCalled();
    stop();
  });
});
