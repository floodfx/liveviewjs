import { LiveViewChangesetFactory, newChangesetFactory } from "liveviewjs";
import { SomeZodObject } from "zod";


export class InMemoryService<T extends { id: any }> {

  private db: Record<string, T> = {}
  readonly changeset: LiveViewChangesetFactory<T>;

  constructor(schema: SomeZodObject) {
    this.changeset = newChangesetFactory<T>(schema)
  }

  all() {
    return Object.values(this.db)
  }

  get(id: string) {
    return this.db[id]
  }

  create(newObject: Partial<T>) {
    return this.change({}, newObject, 'create');
  }

  update(currentObject: T, updatedAttrs: Partial<T>) {
    return this.change(currentObject, updatedAttrs, 'update');
  }

  private change(current: Partial<T>, updated: Partial<T>, action: string) {
    const result = this.changeset(current, updated, action);
    if (result.valid) {
      const newObject = result.data as T;
      this.db[newObject.id] = newObject;
    }
    return result;
  }

}