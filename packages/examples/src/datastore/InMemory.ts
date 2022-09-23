import { LiveViewChangeset, LiveViewChangesetFactory, newChangesetFactory, PubSub } from "liveviewjs";
import { SomeZodObject } from "zod";

type InMemoryChangesetDBOptions = {
  pubSub?: PubSub;
  pubSubTopic?: string;
};

/**
 * An in-memory implementation of a database that works with changesets and pub/sub.
 */
export class InMemoryChangesetDB<T> {
  #store: Record<string, T> = {};
  #changeset: LiveViewChangesetFactory<T>;
  #pubSub?: PubSub;
  #pubSubTopic?: string;

  constructor(schema: SomeZodObject, options?: InMemoryChangesetDBOptions) {
    this.#changeset = newChangesetFactory(schema);
    this.#pubSub = options?.pubSub;
    this.#pubSubTopic = options?.pubSubTopic;
  }

  changeset(existing?: Partial<T>, newAttrs?: Partial<T>, action?: string): LiveViewChangeset<T> {
    return this.#changeset(existing ?? {}, newAttrs ?? {}, action);
  }

  list(): T[] {
    return Object.values(this.#store);
  }

  get(id: string): T | undefined {
    return this.#store[id];
  }

  validate(data: Partial<T>): LiveViewChangeset<T> {
    return this.changeset({}, data, "validate");
  }

  create(data: Partial<T>): LiveViewChangeset<T> {
    const result = this.#changeset({}, data, "create");
    if (result.valid) {
      const newObj = result.data as T;
      // assume there will be an id field
      this.#store[(newObj as any).id] = newObj;
      this.broadcast("created", newObj);
    }
    return result;
  }

  update(current: T, data: Partial<T>): LiveViewChangeset<T> {
    const result = this.#changeset(current, data, "update");
    if (result.valid) {
      const newObj = result.data as T;
      this.#store[(newObj as any).id] = newObj;
      this.broadcast("updated", newObj);
    }
    return result;
  }

  delete(id: string): boolean {
    const data = this.#store[id];
    const deleted = data !== undefined;
    if (deleted) {
      delete this.#store[id];
      this.broadcast("deleted", data);
    }
    return deleted;
  }

  private async broadcast(type: string, data: T) {
    if (this.#pubSub && this.#pubSubTopic) {
      await this.#pubSub.broadcast(this.#pubSubTopic, { type, data });
    }
  }
}
