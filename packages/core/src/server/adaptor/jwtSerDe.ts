import { SerDe } from "./serDe";

/**
 * Cryptographically signed SerDe using Web Standard WebCrypto HMAC-SHA256.
 * 
 * Guarantees data-phx-session tokens cannot be tampered with by clients.
 */
export class JwtSerDe<T = any> implements SerDe<T, string> {
  private secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  private async getCryptoKey(): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.secret);
    return await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );
  }

  async serialize(data: T): Promise<string> {
    const key = await this.getCryptoKey();
    const jsonStr = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(jsonStr);

    const signature = await crypto.subtle.sign("HMAC", key, dataBytes);
    const payloadB64 = Buffer.from(jsonStr).toString("base64url");
    const sigB64 = Buffer.from(signature).toString("base64url");

    return `${payloadB64}.${sigB64}`;
  }

  async deserialize(token: string): Promise<T> {
    if (!token || !token.includes(".")) {
      throw new Error("Invalid signed session token format");
    }

    const [payloadB64, sigB64] = token.split(".");
    const jsonStr = Buffer.from(payloadB64, "base64url").toString("utf-8");
    const signature = Buffer.from(sigB64, "base64url");

    const key = await this.getCryptoKey();
    const encoder = new TextEncoder();
    const isValid = await crypto.subtle.verify("HMAC", key, signature, encoder.encode(jsonStr));

    if (!isValid) {
      throw new Error("Tampered or invalid session token signature");
    }

    return JSON.parse(jsonStr) as T;
  }
}
