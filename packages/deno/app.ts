import { Application, Router, send, nanoid } from './deps.ts';
import { MessageRouter, LiveViewRouter, LightLiveViewComponent } from './deps_local.ts'
import { configLiveViewHandler } from "./liveViewAdaptor.ts"
import { rootTemplateRenderer } from "./liveViewRootTemplate.ts"

const app = new Application();
const router = new Router();

const signingSecret = "foo"
const messageRouter = new MessageRouter()
const liveRouter: LiveViewRouter = {
  '/light': new LightLiveViewComponent(),
}

router.get('/chat', async (ctx) => {
  await send(ctx, 'index.html', {
    root: './',
    index: 'index.html',
  });
})

router.get('/live', async ctx => {
  console.log("connected to ws")
  const sock = await ctx.upgrade();
  const id = nanoid();
  sock.onopen = (ev) => {
    console.log("onopen", id)
  };
  sock.onmessage = async(ev) => {
    console.log("onmessage", ev.data, id)
    await messageRouter.onMessage(sock, ev.data, liveRouter, id, signingSecret)
  }
  sock.onclose = async(ev) => {
    console.log("onclose", id)
    await messageRouter.onClose(ev.code, id);
  }
});


router.use(configLiveViewHandler(
  () => liveRouter,
  rootTemplateRenderer,
  "foo",
))


app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 9001 });