import "reflect-metadata";
import path from "path"
import express, { Application, Request, Response } from 'express'
import { createExpressServer } from 'routing-controllers';
import { POCLiveViewComponent } from './live/poc_liveview'


const publicPath = path.join(__dirname, "..", "dist/public");
const viewsPath = path.join(__dirname, "..", "views");


const app: Application = createExpressServer({

  controllers: [path.join(__dirname, '/controllers/*controller.js')]
})


app.use(express.static(publicPath))

app.get('/', (req: Request, res: Response) => {

  const poc = new POCLiveViewComponent();
  const pocCtx = poc.mount({}, {}, {});
  const pocView = poc.render(pocCtx);
  res.send(pocView.toString())

})

const port: number = 3002

app.listen(port, function () {
  console.log(`App is listening on port ${port} !`)
})