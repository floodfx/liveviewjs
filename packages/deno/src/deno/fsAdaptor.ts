import { FileSystemAdaptor } from "../deps.ts";

export class DenoFileSystemAdaptor implements FileSystemAdaptor {
  // make temp dir once
  tempDir = Deno.makeTempDirSync({ suffix: "com.liveviewjs.files" });

  tempPath(lastPathPart: string): string {
    return `${this.tempDir}/${lastPathPart}`;
  }
  writeTempFile(dest: string, data: Buffer) {
    Deno.writeFileSync(dest, data, { create: true });
  }
  createOrAppendFile(dest: string, src: string) {
    Deno.writeFileSync(dest, Deno.readFileSync(src), {
      append: true,
      create: true,
    });
  }
}
