/**
 * A class that knows how to serialize (Ser) and deserialize (De) session data.  This is used to pass
 * session data from the initial http request to the websocket connection.  You should use a strategy that
 * cannot be tampered with such as signed JWT tokens or other cryptographically safe serialization/deserializations.
 */
export interface SerDe {
  serialize<T>(data: T): Promise<string>;
  deserialize<T>(data: string): Promise<T>;
}
