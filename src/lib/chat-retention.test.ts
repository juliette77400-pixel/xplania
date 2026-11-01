import { describe, expect, it } from "vitest";
import { isChatExpired, keepRecentMessages } from "./chat-retention";

const NOW = Date.parse("2026-11-20T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

describe("assistant conversations are kept 30 days after the last message", () => {
  it("keeps a conversation whose last message is 29 days old", () => {
    expect(isChatExpired(NOW - 29 * DAY, NOW)).toBe(false);
  });
  it("expires a conversation whose last message is 31 days old", () => {
    expect(isChatExpired(NOW - 31 * DAY, NOW)).toBe(true);
  });
  it("expires a conversation without a known date", () => {
    expect(isChatExpired(undefined, NOW)).toBe(true);
  });
  it("drops only the messages older than 30 days", () => {
    const msgs = [{ ts: NOW - 40 * DAY, id: "old" }, { ts: NOW - 2 * DAY, id: "recent" }, { id: "no-date" }];
    expect(keepRecentMessages(msgs, NOW).map((m) => m.id)).toEqual(["recent"]);
  });
});
