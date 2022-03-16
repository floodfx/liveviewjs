export class Flash extends Map<string, string> {
  getFlash(key: string): string | undefined {
    const value = this.get(key);
    this.delete(key);
    return value;
  }
}
