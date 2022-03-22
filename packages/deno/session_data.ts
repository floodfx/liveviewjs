import type { SessionDataProvider } from "../server/common/session_data_provider.ts";

// export class DenoSessionDataProvder<SessionData> implements SessionDataProvider<SessionData, Request> {
//   sessionData(req: Request): Promise<SessionData> {
//     return Promise.resolve({ csrfToken: "csrfToken" });
//   }
// }