import { SerDe } from "./serDe";

/**
 * A SerDe (serializer/deserializer) that uses JSON.stringify and JSON.parse.
 * WARNING: this is not secure so should only be used for testing.
 */
export class JsonSerDe<T> implements SerDe<T, string> {
  serialize<T>(obj: T) {
    return Promise.resolve(JSON.stringify(obj));
  }

  deserialize<T>(data: string) {
    return Promise.resolve(JSON.parse(data) as T);
  }
}
