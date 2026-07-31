import { describe, test, expect } from "bun:test";
import { JwtSerDe } from "./jwtSerDe";

describe("JwtSerDe - WebCrypto HMAC-SHA256 Signed Session Token Suite", () => {
  const secret = "super-secret-key-12345678901234567890";
  const jwtSerDe = new JwtSerDe(secret);

  test("1. Successfully serializes and deserializes session data object", async () => {
    const session = { _csrf_token: "csrf-12345", user_id: 42, is_admin: true };
    const token = await jwtSerDe.serialize(session);

    expect(typeof token).toBe("string");
    expect(token).toContain(".");

    const deserialized = await jwtSerDe.deserialize(token);
    expect(deserialized).toEqual(session);
  });

  test("2. Rejects tampered payload content", async () => {
    const session = { _csrf_token: "csrf-12345", is_admin: false };
    const token = await jwtSerDe.serialize(session);

    const [payloadB64, sigB64] = token.split(".");
    // Tamper with payload (change false to true)
    const tamperedPayload = Buffer.from(
      JSON.stringify({ _csrf_token: "csrf-12345", is_admin: true })
    ).toString("base64url");
    const tamperedToken = `${tamperedPayload}.${sigB64}`;

    expect(jwtSerDe.deserialize(tamperedToken)).rejects.toThrow(
      "Tampered or invalid session token signature"
    );
  });

  test("3. Rejects tampered signature bytes", async () => {
    const session = { _csrf_token: "csrf-12345" };
    const token = await jwtSerDe.serialize(session);

    const [payloadB64, sigB64] = token.split(".");
    // Corrupt last character of signature
    const tamperedSig = sigB64.slice(0, -1) + (sigB64.endsWith("A") ? "B" : "A");
    const tamperedToken = `${payloadB64}.${tamperedSig}`;

    expect(jwtSerDe.deserialize(tamperedToken)).rejects.toThrow(
      "Tampered or invalid session token signature"
    );
  });

  test("4. Rejects token signed with a different secret key", async () => {
    const session = { _csrf_token: "csrf-12345" };
    const token = await jwtSerDe.serialize(session);

    const wrongKeySerDe = new JwtSerDe("different-wrong-secret-9999999999");
    expect(wrongKeySerDe.deserialize(token)).rejects.toThrow(
      "Tampered or invalid session token signature"
    );
  });

  test("5. Throws on malformed token strings without dot separator", async () => {
    expect(jwtSerDe.deserialize("invalid-token-string-no-dot")).rejects.toThrow(
      "Invalid signed session token format"
    );
    expect(jwtSerDe.deserialize("")).rejects.toThrow(
      "Invalid signed session token format"
    );
  });
});
