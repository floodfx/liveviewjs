import { BaseLiveView, LiveContext, LiveEvent, LiveInfo } from "./liveView";

/**
 * ClassLiveView extends BaseLiveView to provide class-based ergonomics
 * matching HotdogJS (`class MyView extends ClassLiveView`).
 */
export abstract class ClassLiveView<
  TContext extends LiveContext = LiveContext,
  TEvents extends LiveEvent = LiveEvent,
  TInfos extends LiveInfo = LiveInfo
> extends BaseLiveView<TContext, TEvents, TInfos> {}
