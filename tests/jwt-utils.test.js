import { describe, expect, it } from "vitest";
import {
  checkValidityReasons,
  formatTimeString,
  keysAreCompatible,
  looksLikeJwt,
  looksLikeJwks,
  looksLikePem,
  quantify,
  reformIndents,
  requiredKeyBitsForAlg,
  signingAlgs,
  timeAgo,
} from "../src/js/jwt-utils.js";

describe("quantify", () => {
  it("singularizes plural terms for quantity 1", () => {
    expect(quantify(1, "seconds")).toBe("second");
  });

  it("pluralizes singular terms for other quantities", () => {
    expect(quantify(5, "second")).toBe("seconds");
  });
});

describe("reformIndents", () => {
  it("trims each line and outer whitespace", () => {
    expect(reformIndents("  line one \n  line two  \n")).toBe("line one\nline two");
  });
});

describe("timeAgo", () => {
  it("formats relative times from a fixed clock", () => {
    const now = Date.parse("2024-06-01T12:00:00Z");
    const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
    expect(timeAgo(fiveMinutesAgo, now)).toBe("5 minutes ago");
  });
});

describe("formatTimeString", () => {
  it("drops millisecond precision from ISO timestamps", () => {
    expect(formatTimeString(new Date("2024-06-01T12:00:00.000Z"))).toBe(
      "2024-06-01T12:00:00Z",
    );
  });
});

describe("requiredKeyBitsForAlg", () => {
  it("maps HMAC algorithms to bit lengths", () => {
    expect(requiredKeyBitsForAlg("HS256")).toBe(256);
    expect(requiredKeyBitsForAlg("HS512")).toBe(512);
  });

  it("extracts HMAC size from PBES2 algorithms", () => {
    expect(requiredKeyBitsForAlg("PBES2-HS384+A192KW")).toBe(384);
  });
});

describe("looksLikePem", () => {
  it("accepts PKCS#8 private keys", () => {
    const pem = "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----";
    expect(looksLikePem(pem)).toBe(true);
  });

  it("rejects partial PEM blocks", () => {
    expect(looksLikePem("-----BEGIN PRIVATE KEY-----")).toBe(false);
  });
});

describe("looksLikeJwks", () => {
  it("parses a minimal JWKS document", () => {
    const jwks = JSON.stringify({ keys: [{ kty: "RSA", kid: "1" }] });
    expect(looksLikeJwks(jwks)).toEqual({ keys: [{ kty: "RSA", kid: "1" }] });
  });

  it("returns false for invalid JSON", () => {
    expect(looksLikeJwks("{not-json")).toBe(false);
  });
});

describe("checkValidityReasons", () => {
  const nowSeconds = 1_700_000_000;

  it("flags missing alg headers", () => {
    expect(checkValidityReasons({}, {}, signingAlgs, nowSeconds)).toContain(
      "the header lacks the required alg property",
    );
  });

  it("flags expired tokens", () => {
    const reasons = checkValidityReasons(
      { alg: "HS256" },
      { exp: nowSeconds - 60 },
      signingAlgs,
      nowSeconds,
    );
    expect(reasons.some((reason) => reason.includes("expiry time"))).toBe(true);
  });

  it("accepts valid claims", () => {
    expect(
      checkValidityReasons(
        { alg: "HS256" },
        { exp: nowSeconds + 3600, iat: nowSeconds - 10 },
        signingAlgs,
        nowSeconds,
      ),
    ).toEqual([]);
  });
});

describe("keysAreCompatible", () => {
  it("treats RS and PS families as compatible", () => {
    expect(keysAreCompatible("RS256", "PS384")).toBe(true);
  });

  it("requires exact match for EC algorithms", () => {
    expect(keysAreCompatible("ES256", "ES384")).toBe(false);
  });
});

describe("looksLikeJwt", () => {
  it("detects signed JWT structure", () => {
    expect(looksLikeJwt("a.b.c")).toBe(true);
  });

  it("detects encrypted JWT structure", () => {
    expect(looksLikeJwt("a..c.d.e")).toBe(true);
  });

  it("rejects arbitrary strings", () => {
    expect(looksLikeJwt("not-a-jwt")).toBe(false);
  });
});