import { create, verify } from "./deps.ts";
import { SerDe } from "./build/liveview.mjs";

const key = await crypto.subtle.generateKey(
  { name: "HMAC", hash: "SHA-512" },
  true,
  ["sign", "verify"],
);

export class DenoJwtSerDe implements SerDe {
  async serialize<T extends { [key: string]: any }>(
    payload: T,
  ): Promise<string> {
    const ser = await create({ alg: "HS512", type: "JWT" }, payload, key);
    return ser.toString();
  }

  async deserialize<T extends { [key: string]: any }>(
    token: string,
  ): Promise<T> {
    const des = await verify(token, key) as T;
    return des;
  }
}
