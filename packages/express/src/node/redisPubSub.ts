import { RedisClientOptions, RedisClientType } from "@node-redis/client";
import crypto from "crypto";
import { createClient } from "redis";
import { Publisher, Subscriber, SubscriberFunction } from "liveviewjs";

/**
 * A PubSub implementation that uses Redis as a backend.
 * e.g. new RedisPubSub({ url: process.env.REDIS_URL || "redis://localhost:6379" })
 *
 * See: https://github.com/redis/node-redis#pubsub
 */
export class RedisPubSub implements Subscriber, Publisher {
  private redis: RedisClientType;
  private subscribers: Record<string, RedisClientType> = {};

  constructor(options: RedisClientOptions) {
    this.redis = createClient(options);
    this.redis.connect();
  }

  public async subscribe<T>(topic: string, subscriber: SubscriberFunction<T>): Promise<string> {
    // create new connection for each subscription
    const redisSub = this.redis.duplicate();
    await redisSub.connect();

    // parse data to JSON before passing to subscriber
    redisSub.subscribe(topic, (data: string) => {
      subscriber(JSON.parse(data) as T);
    });

    // store connection id for unsubscribe and return for caller
    const subscriptionId = crypto.randomBytes(10).toString("hex");
    this.subscribers[subscriptionId] = redisSub;
    return subscriptionId;
  }

  public async broadcast<T>(topic: string, data: T): Promise<void> {
    if (!this.redis.isOpen) {
      await this.redis.connect();
    }
    await this.redis.publish(topic, JSON.stringify(data));
  }

  public async unsubscribe(topic: string, subscriberId: string): Promise<void> {
    // look up redis connection from subscriber id
    const redisSub = this.subscribers[subscriberId];
    await redisSub.unsubscribe(topic);
    // remove subscriber from subscribers
    delete this.subscribers[subscriberId];
  }
}
