import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import { LiveView, PageTitleDefaults } from ".";
import { HttpLiveComponentSocket, LiveComponent, LiveComponentContext, LiveViewContext, LiveViewTemplate } from "./component";
import { HttpLiveViewSocket } from "./socket/live_socket";

type SessionDataProvider<T extends {csrfToken: string}> = (req: Request) => T;

const emptyVoid = () => {};

export const configLiveViewHandler = <T extends {csrfToken: string}>(
  getPath: string,
  component: LiveView<LiveViewContext,unknown>,
  rootView: string,
  signingSecret: string,
  sessionDataProvider: SessionDataProvider<T>,
  pageTitleDefaults?: PageTitleDefaults
): [string, (req:Request, res: Response, next: NextFunction) => Promise<void>] => {
  return [getPath, async (req:Request, res: Response, next: NextFunction) => {

    // new LiveViewId for each request
    const liveViewId = nanoid();

    // mock socket
    const liveViewSocket = new HttpLiveViewSocket<LiveViewContext>(liveViewId, {});

    // get session data from provider
    const session = sessionDataProvider(req);

    // mount and render component
    await component.mount(
      {
        _csrf_token: session.csrfToken,
        _mounts: -1
      },
      session,
      liveViewSocket
    );

    // handle params
    await component.handleParams(req.query, req.url, liveViewSocket);

    // pass LiveViewContext and LiveViewMeta to render
    const lvContext = liveViewSocket.context;
    let myself = 1;
    const view = await component.render(lvContext, {
      csrfToken: session.csrfToken,
      async live_component(liveComponent: LiveComponent<LiveComponentContext>, params?: Partial<LiveComponentContext & { id: string | number; }>): Promise<LiveViewTemplate> {
        // params may be empty
        params = params ?? {};
        delete params.id; // remove id before passing to socket

        // create live component socket
        const lcSocket = new HttpLiveComponentSocket<LiveComponentContext>(liveViewId, params as unknown as LiveComponentContext);

        // update socket with params
        lcSocket.assign(params);

        // run lifecycle
        await liveComponent.mount(lcSocket);
        await liveComponent.update(lcSocket);

        // render view with context
        const lcContext = lcSocket.context;
        const newView = await liveComponent.render(lcContext, {myself: myself});
        myself++;
        // since http request is stateless send back the LiveViewTemplate
        return newView;
      }
    });

    // render the view with all the data
    res.render(rootView, {
      page_title: pageTitleDefaults?.title ?? "",
      page_title_prefix: pageTitleDefaults?.prefix,
      page_title_suffix: pageTitleDefaults?.suffix,
      csrf_meta_tag: req.session.csrfToken,
      liveViewId,
      session: jwt.sign(session, signingSecret),
      // TODO support static assets https://github.com/floodfx/liveviewjs/issues/42
      statics: jwt.sign(JSON.stringify(view.statics), signingSecret),
      inner_content: view.toString()
    })
  }]
}