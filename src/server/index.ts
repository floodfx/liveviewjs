import "reflect-metadata";
import path from "path"
import express, { Application } from 'express'
import { createExpressServer } from 'routing-controllers';


const publicPath = path.join(__dirname, "..", "dist/public");
const viewsPath = path.join(__dirname, "..", "views");


const app: Application = createExpressServer({

  controllers: [path.join(__dirname, '/controllers/*controller.js')]
})


app.use(express.static(publicPath))

const port: number = 3001

app.listen(port, function () {
  console.log(`App is listening on port ${port} !`)
})