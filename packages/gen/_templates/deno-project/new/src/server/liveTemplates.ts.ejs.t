---
to: src/server/liveTemplates.ts
---
import { html, LiveTitleOptions, LiveViewHtmlPageTemplate, LiveViewTemplate, live_title_tag, safe } from "liveviewjs";

/**
 * Minimal HTML page template that embeds your LiveViews.  LiveViewJS will provide
 * the params to this function when rendering your LiveViews. You must use the
 * LiveViewJS html template tag to create your LiveViewTemplate.
 * @param liveTitleOptions the LiveTitleOptions allowing dynamic page titles
 * @param csrfToken the CSRF token value that prevents cross-site request forgery
 * @param liveViewContent the liveViewContent to embed in the page
 * @returns the LiveViewTemplate for the page
 */
export const htmlPageTemplate: LiveViewHtmlPageTemplate = (
  liveTitleOptions: LiveTitleOptions,
  csrfToken: string,
  liveViewContent: LiveViewTemplate
): LiveViewTemplate => {
  return html`
    <!DOCTYPE html>
    <html lang="en" class="h-full bg-white">
      <head>
        <meta charset="utf-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="csrf-token" content="${csrfToken}" />
        ${live_title_tag(liveTitleOptions)}
        <!-- LiveViewJS Client Javascript - compiled from src/client/index.ts -->
        <script defer type="text/javascript" src="/js/index.js"></script>
        <!-- Tailwind CSS: we recommend replacing this with your own CSS -->
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>
        <!-- Embedded LiveView -->
        ${safe(liveViewContent)}
      </body>
    </html>
  `;
};
