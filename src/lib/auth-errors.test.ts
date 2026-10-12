import { describe, expect, it } from "vitest";
import { authErrorKey } from "./auth-errors";

describe("localized auth errors", () => {
  it("prioritizes rate limits over password messages", () => {
    expect(authErrorKey("Password reset rate limit exceeded")).toBe("auth.errRate");
  });
  it("recognizes unchanged passwords", () => {
    expect(authErrorKey("New password should be different from the same password")).toBe("auth.errSamePassword");
  });
  it("uses a localized fallback and known messages", () => {
    expect(authErrorKey("Failed to fetch")).toBe("auth.errGeneric");
    expect(authErrorKey("Email not confirmed")).toBe("auth.errNotConfirmed");
    expect(authErrorKey("Invalid login credentials")).toBe("auth.errInvalid");
  });
});