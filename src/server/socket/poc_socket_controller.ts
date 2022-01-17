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
import { POCLiveViewComponent } from '../live/poc_liveview';

enum PhxSocketProtocolNames {
  joinRef = 0,
  messageRef,
  topic,
  event,
  payload
}

type PhxSocketProtocol<Payload> = [
  joinRef: number,
  messageRef: number,
  topic: number,
  event: "phx_reply" | string,
  payload: Payload
]

interface PhxJoinPayload {
  params: { _csrf: string } & { [key: string]: string }
  session: string
  static: string
  url: string
}

type PhxJoin = PhxSocketProtocol<PhxJoinPayload>;


type Dynamics = { [key: number]: string | Dynamics }

type RenderedNode = { [key: number]: string | RenderedNode } & { [key in "s"]: readonly string[] }

interface Rendered {
  rendered: RenderedNode
}

interface Diff {
  diff: Dynamics
}

interface PhxReplyPayload {
  response: Rendered | Diff | {}
  status: "ok"
}

type PhxReply = PhxSocketProtocol<PhxReplyPayload>;

interface PhxEventPayload<T> {
  type: string,
  event: string,
  value: T
}

type PhxEvent<T> = PhxSocketProtocol<PhxEventPayload<T>>

@SocketController()
export class POCSocketController {

  @OnConnect()
  connection(@ConnectedSocket() socket: any, @SocketIO() io: Socket, @SocketId() socketId: string) {
    console.log('client connected:', socketId);

    // run mount here?
  }

  @OnMessage('phx_join')
  phx_join(@ConnectedSocket() socket: any, @SocketId() socketId: string, @MessageBody() message: PhxJoin) {

    // get current context for this socketid
    // render the view and send response
    const poc = new POCLiveViewComponent();
    const pocCtx = poc.mount({}, {}, {});
    const pocView = poc.render(pocCtx);

    // map array of dynamics to object with indiceies as keys
    const dynamics = pocView.dynamics.reduce((acc: { [key: number]: unknown }, cur, index: number) => {
      acc[index] = cur;
      return acc;
    }, {} as { [key: number]: unknown })

    const rendered: Rendered = {
      rendered: {
        ...dynamics,
        s: pocView.statics
      }
    }

    const reply: PhxReply = [
      message[0],
      message[1],
      message[2],
      "phx_reply",
      {
        response: {
          ...rendered
        },
        status: "ok"
      }
    ]
    console.log("sending phx_reply", reply);
    socket.emit('phx_reply', reply);
  }

  @OnMessage('event')
  on(@ConnectedSocket() socket: any, @MessageBody() message: PhxEvent<any>) {
    // update context
    // rerun render
    // send back dynamics if they changed
    console.log('socket:');
    console.log('message:', message);

    const poc = new POCLiveViewComponent();
    const pocCtx = poc.mount({}, {}, {}); // Look up current ctx

    let brightness = pocCtx.data.brightness;
    const payload = message[PhxSocketProtocolNames.payload];

    switch (payload.event) {
      case "on":
        brightness = 100;
        break;
      case "off":
        brightness = 0;
        break;
    }

    const pocView = poc.render({ ...pocCtx, data: { brightness } });

    // map array of dynamics to object with indiceies as keys
    const dynamics = pocView.dynamics.reduce((acc: { [key: number]: string }, cur: string, index: number) => {
      acc[index] = cur;
      return acc;
    }, {} as { [key: string]: string })

    const diff: Diff = {
      diff: {
        ...dynamics
      }
    }

    const reply: PhxReply = [
      message[0],
      message[1],
      message[2],
      "phx_reply",
      {
        response: {
          ...diff
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