import fs from "fs";
import { FilesAdapter } from "liveviewjs";
import os from "os";
import path from "path";

export class NodeFilesAdatptor implements FilesAdapter {
  tempPath(lastPathPart: string): string {
    return path.join(os.tmpdir(), lastPathPart);
  }
  writeTempFile(dest: string, data: Buffer) {
    fs.writeFileSync(dest, data);
  }
  createOrAppendFile(dest: string, src: string) {
    fs.appendFileSync(dest, fs.readFileSync(src));
  }
}
