import fs from "fs";
import os from "os";
import path from "path";
import { FilesAdapter } from "./files";

export class TestNodeFilesAdatptor implements FilesAdapter {
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
