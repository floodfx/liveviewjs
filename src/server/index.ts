import "reflect-metadata";
import path from "path"
import express, { Application, Request, Response } from 'express'
import { createExpressServer } from 'routing-controllers';
import escapeHtml, { HtmlSafeString } from './liveview/templates/index';


const publicPath = path.join(__dirname, "..", "dist/public");
const viewsPath = path.join(__dirname, "..", "views");


const app: Application = createExpressServer({

  controllers: [path.join(__dirname, '/controllers/*controller.js')]
})


app.use(express.static(publicPath))

app.get('/', (req: Request, res: Response) => {

  res.send(escapeHtml`
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8"/>
      <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <%= csrf_meta_tag() %>
      <%= live_title_tag assigns[:page_title] || "LiveViewStudio", suffix: " · Phoenix Framework" %>
      <link rel="stylesheet" href="<%= Routes.static_path(@conn, "/css/app.css") %>"/>
      <script defer type="text/javascript" src="<%= Routes.static_path(@conn, "/js/app.js") %>"></script>
    </head>
    <body>
      <header>
      </header>
      <%= @inner_content %>
    </body>
  </html>
  `.toString())

})

const port: number = 3002

app.listen(port, function () {
  console.log(`App is listening on port ${port} !`)
})