/**
 * Generically represent session with `string` keys to `any` value and a named member called
 * `_csrf_token` that is used to protect against cross-site request forgery attacks.
 */
export type SessionData = {
  /**
   * The CSRF token used to protect against cross-site request forgery attacks.
   */
  _csrf_token?: string;
  [key: string]: any;
};
