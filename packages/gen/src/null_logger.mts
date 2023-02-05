import { Logger } from "hygen";

// logger that ignores all messages
export class NullLogger extends Logger {
  constructor() {
    super(() => {});
  }
}
