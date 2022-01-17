import "reflect-metadata";
import path from "path"
import express, { Application, Request, Response } from 'express'
import { createExpressServer } from 'routing-controllers';
import { useSocketServer } from 'socket-controllers';
import { POCLiveViewComponent } from './live/poc_liveview'
import { Server as HTTPServer } from 'http';
import { Server as SocketServer } from 'socket.io';


const publicPath = path.join(__dirname, "..", "dist/public");
const viewsPath = path.join(__dirname, "..", "views");


const app: Application = createExpressServer({
  controllers: [path.join(__dirname, '/controllers/*controller.js')]
})

const server = new HTTPServer(app);
const io = new SocketServer(server);

useSocketServer(io, {
  controllers: [path.join(__dirname, '/socket/*controller.js')]
});

app.use(express.static(publicPath))

app.get('/', (req: Request, res: Response) => {

  const poc = new POCLiveViewComponent();
  const pocCtx = poc.mount({}, {}, {});
  const pocView = poc.render(pocCtx);
  res.send(pocView.toString())

})

const port: number = 3002

server.listen(port, function () {
  console.log(`App is listening on port ${port} !`)
})

