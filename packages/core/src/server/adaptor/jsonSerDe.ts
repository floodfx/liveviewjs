import { SerDe } from "./serDe";

/**
 * A SerDe (serializer/deserializer) that uses JSON.stringify and JSON.parse.
 * WARNING: this is not secure so should only be used for testing.
 */
export class JsonSerDe implements SerDe {
  serialize<T>(obj: T): Promise<string> {
    return Promise.resolve(JSON.stringify(obj));
  }

  deserialize<T>(data: string): Promise<T> {
    return Promise.resolve(JSON.parse(data) as T);
  }
}
