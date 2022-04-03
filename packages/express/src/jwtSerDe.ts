import { SerDe, SessionData } from "liveviewjs";
import jwt from "jsonwebtoken";

/**
 * Session data serializer/deserializer for Node using JWT tokens.
 */
export class NodeJwtSerDe implements SerDe {
  private secretOrPrivateKey: string;
  constructor(secretOrPrivateKey: string) {
    this.secretOrPrivateKey = secretOrPrivateKey;
  }
  deserialize<T extends SessionData>(data: string): Promise<T> {
    return Promise.resolve(jwt.verify(data, this.secretOrPrivateKey) as T);
  }

  serialize<T extends SessionData>(data: T): Promise<string> {
    return Promise.resolve(jwt.sign(data as unknown as object, this.secretOrPrivateKey));
  }
}
