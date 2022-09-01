import fs from "fs";
import { FileSystemAdaptor } from "liveviewjs";
import os from "os";
import path from "path";

export class NodeFileSystemAdatptor implements FileSystemAdaptor {
  tempPath(lastPathPart: string): string {
    // ensure the temp directory exists
    const tempDir = path.join(os.tmpdir(), "com.liveviewjs.files");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    return path.join(tempDir, lastPathPart);
  }
  writeTempFile(dest: string, data: Buffer) {
    fs.writeFileSync(dest, data);
  }
  createOrAppendFile(dest: string, src: string) {
    fs.appendFileSync(dest, fs.readFileSync(src));
  }
}
