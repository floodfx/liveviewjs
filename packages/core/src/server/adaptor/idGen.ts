/**
 * Type that defines a function that returns a string ID used to identify a unique http request
 * and/or websocket connection.  Should generate unique IDs for each request and connection.  Good
 * concrete implementations are: nanoid, shortid, uuidv4 (though these are long).
 */
export type IdGenerator = () => string;
