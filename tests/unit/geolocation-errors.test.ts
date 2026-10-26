import { describe, expect, it } from "vitest";

import { mapGeolocationPositionError } from "@/lib/geolocation/errors";

describe("mapGeolocationPositionError (§8)", () => {
  it("code 1 (PERMISSION_DENIED) → denied", () => {
    expect(mapGeolocationPositionError({ code: 1 })).toBe("denied");
  });

  it("code 2 (POSITION_UNAVAILABLE) → unavailable", () => {
    expect(mapGeolocationPositionError({ code: 2 })).toBe("unavailable");
  });

  it("code 3 (TIMEOUT) → timeout", () => {
    expect(mapGeolocationPositionError({ code: 3 })).toBe("timeout");
  });

  it("tout autre code → error (filet de sécurité)", () => {
    expect(mapGeolocationPositionError({ code: 0 })).toBe("error");
    expect(mapGeolocationPositionError({ code: 99 })).toBe("error");
  });
});
