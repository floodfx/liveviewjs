/**
 * Abstracts some simple file system operations.  Necessary to support
 * both nodejs and deno since those APIs differ.
 */
export interface FileSystemAdaptor {
  /**
   * Get a temporary file path from the OS with the lastPathPart as the file name.
   */
  tempPath: (lastPathPart: string) => string;
  /**
   * Writes the data to the given destination path.
   */
  writeTempFile: (dest: string, data: Buffer) => void;
  /**
   * Creates and/or appends data from src to dest
   */
  createOrAppendFile: (dest: string, src: string) => void;
}
