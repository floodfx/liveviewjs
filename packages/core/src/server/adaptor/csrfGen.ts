/**
 * Type that defines a function that returns a string value used for protecting requests against
 * Cross-site Request Forgery (CSRF) attacks.  Good concrete implementations are: crypto.randomBytes, uuidv4.
 */
export type CsrfGenerator = () => string;
