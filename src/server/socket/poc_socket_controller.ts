import {
  OnConnect,
  SocketController,
  ConnectedSocket,
  OnDisconnect,
  MessageBody,
  OnMessage,
  SocketIO,
  SocketId,
} from 'socket-controllers';
import { Socket } from 'socket.io';
import { PocEvent, POCLiveViewComponent } from '../live/poc_liveview';
import { PhxJoin, PhxEvent, PhxReply, PhxSocketProtocolNames, RenderedNode } from './types';


@SocketController()
export class POCSocketController {

  @OnConnect()
  connection(@ConnectedSocket() socket: any, @SocketIO() io: Socket, @SocketId() socketId: string) {
    console.log('client connected:', socketId);

    // run mount here?
  }

  @OnMessage('phx_join')
  phx_join(@ConnectedSocket() socket: any, @SocketId() socketId: string, @MessageBody() message: PhxJoin) {
    console.log('socket:', socketId);
    console.log('join:', message);
    // get current context for this socketid
    // render the view and send response
    const poc = new POCLiveViewComponent();
    const pocCtx = poc.mount({}, {}, { id: socketId });
    const pocView = poc.render(pocCtx);

    // map array of dynamics to object with indiceies as keys
    const dynamics = pocView.dynamics.reduce((acc: { [key: number]: unknown }, cur, index: number) => {
      acc[index] = cur;
      return acc;
    }, {} as { [key: number]: unknown })

    const rendered: RenderedNode = {
      ...dynamics,
      s: pocView.statics
    }

    const reply: PhxReply = [
      message[0],
      message[1],
      message[2],
      "phx_reply",
      {
        response: {
          rendered
        },
        status: "ok"
      }
    ]

    const statics = rendered.s;
    let html = statics[0];
    for (let i = 1; i < statics.length; i++) {
      html += rendered[i - 1] + statics[i];
    }

    // console.log(html)
    // console.log("sending phx_reply", reply);
    socket.emit('phx_reply', reply);
  }

  @OnMessage('event')
  on(@ConnectedSocket() socket: any, @SocketId() socketId: string, @MessageBody() message: PhxEvent<PocEvent>) {
    // update context
    // rerun render
    // send back dynamics if they changed
    console.log('socket:', socketId);
    console.log('event:', message);

    const poc = new POCLiveViewComponent();

    const payload = message[PhxSocketProtocolNames.payload];

    const newPocCtx = poc.handleEvent(payload.event as PocEvent, payload.value, { id: socketId });

    const pocView = poc.render(newPocCtx);

    // map array of dynamics to object with indiceies as keys
    const dynamics = pocView.dynamics.reduce((acc: { [key: number]: string }, cur: string, index: number) => {
      acc[index] = cur;
      return acc;
    }, {} as { [key: string]: string })

    const reply: PhxReply = [
      message[0],
      message[1],
      message[2],
      "phx_reply",
      {
        response: {
          diff: {
            ...dynamics
          }
        },
        status: "ok"
      }
    ]
    console.log("sending phx_reply", reply);
    socket.emit('phx_reply', reply);
  }

  @OnDisconnect()
  disconnect(@ConnectedSocket() socket: any) {
    console.log('client disconnected');
  }

}


