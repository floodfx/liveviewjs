import {
  html,
  LiveTitleOptions,
  LiveViewHtmlPageTemplate,
  LiveViewTemplate,
  LiveViewWrapperTemplate,
  live_title_tag,
  safe,
  SessionData,
  SessionFlashAdaptor,
} from "liveviewjs";

/**
 * Render function for the "root" of the LiveView.  Expected that this function will
 * embed the LiveView inside and contain the necessary HTML tags to make the LiveView
 * work including the client javascript.
 * @param liveTitleOptions the PageTitleDefauls that should be used for the title tag especially if it is a `live_title_tag`
 * @param csrfToken the CSRF token value that should be embedded into a <meta/> tag named "csrf-token". LiveViewJS uses this to validate socket requests
 * @param liveViewContent the content rendered by the LiveView
 * @returns a LiveViewTemplate that can be rendered by the LiveViewJS server
 */
export const iosPageRenderer: LiveViewHtmlPageTemplate = (
  liveTitleOptions: LiveTitleOptions,
  csrfToken: string,
  liveViewContent: LiveViewTemplate
): LiveViewTemplate => {
  const pageTitle = liveTitleOptions?.title ?? "";
  const pageTitlePrefix = liveTitleOptions?.prefix ?? "";
  const pageTitleSuffix = liveTitleOptions?.suffix ?? "";
  return html`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="csrf-token" content="${csrfToken}" />
        ${live_title_tag(pageTitle, { prefix: pageTitlePrefix, suffix: pageTitleSuffix })}
        <script
          defer
          type="text/javascript"
          src="https://cdn.deno.land/liveviewjs/versions/0.3.0/raw/packages/examples/dist/liveviewjs-examples.browser.js"></script>
      </head>
      <body>
        ${safe(liveViewContent)}
      </body>
    </html>
  `;
};

/**
 * Render function used by all LiveViews for common elements, in this case, flash content.
 * @param session the session data for the current request
 * @param liveViewContent the content rendered by the LiveView
 * @returns a LiveViewTemplate to be embedded in the root template
 */
export const iosRootRenderer: LiveViewWrapperTemplate = async (
  session: SessionData,
  liveViewContent: LiveViewTemplate
): Promise<LiveViewTemplate> => {
  const flashAdaptor = new SessionFlashAdaptor();
  const infoFlash = (await flashAdaptor.popFlash(session, "info")) || "";
  const errorFlash = (await flashAdaptor.popFlash(session, "error")) || "";
  return html`${safe(liveViewContent)}`;
};
