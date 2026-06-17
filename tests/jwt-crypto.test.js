import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import jose from "node-jose";

describe("node-jose JWT round trip", () => {
  it("signs and verifies HS256 tokens", async () => {
    const key = await jose.JWK.asKey({
      kty: "oct",
      k: Buffer.alloc(32, 7),
      use: "sig",
    });
    const payload = JSON.stringify({ sub: "test-user", aud: "jwt-webtool" });
    const signer = jose.JWS.createSign({ format: "compact", alg: "HS256" }, key);
    signer.update(payload, "utf8");
    const jwt = await signer.final();

    const verifier = jose.JWS.createVerify(key);
    const result = await verifier.verify(jwt);

    expect(JSON.parse(result.payload.toString())).toEqual({
      sub: "test-user",
      aud: "jwt-webtool",
    });
    expect(result.header.alg).toBe("HS256");
  });
});