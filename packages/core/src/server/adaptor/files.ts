export interface FilesAdapter {
  tempPath: (lastPathPart: string) => string;
  writeTempFile: (dest: string, data: Buffer) => void;
  createOrAppendFile: (dest: string, src: string) => void;
}
