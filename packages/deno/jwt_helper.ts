import { create } from "./deps.ts";
import { JwtHelper } from "../server/common/jwt_helper.ts";


export class DenoJwtHelper implements JwtHelper {

  private signingSecret: string;
  private key: CryptoKey | undefined;

  constructor(signingSecret: string) {
    this.signingSecret = signingSecret;
  }

  async sign(payload: unknown): Promise<string> {
    await this.generateKey();
    return create({alg: "HS512", type: "JWT"}, payload as any, this.key!);
  }

  private async generateKey() {
    if(this.key) {
      return;
    } else {
      this.key = await crypto.subtle.generateKey(
        { name: "HMAC", hash: "SHA-512" },
        true,
        ["sign", "verify"],
      );
    }
  }
}