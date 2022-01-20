import { PocEvent, POCLiveViewComponent } from '../live/poc_liveview';
import { PhxJoin, PhxEvent, PhxReply, PhxSocketProtocolNames, RenderedNode, PhxSocketProtocol, newHeartbeatReply } from './types';
import ws from 'ws';

const wsServer = new ws.Server({
  port: 3003,
});

wsServer.on('connection', socket => {
  // console.log("socket connected", socket);

  socket.on('open', () => {
    console.log("socket opened");
  });
  socket.on('message', message => {
    console.log("message", String(message));
    // get raw message to string
    const stringMsg = message.toString();
    // console.log("message", stringMsg);

    // parse string to JSON
    const rawPhxMessage = JSON.parse(stringMsg);
    // console.log("rawPhxMessage", rawPhxMessage);

    // rawPhxMessage must be an array with 5 elements
    if (typeof rawPhxMessage === 'object' && Array.isArray(rawPhxMessage) && rawPhxMessage.length === 5) {
      const [joinRef, messageRef, topic, event, payload] = rawPhxMessage;
      switch (event) {
        case "phx_join":
          onPhxJoin(socket, rawPhxMessage as PhxJoin);
          break;
        case "heartbeat":
          onHeartbeat(socket, rawPhxMessage as PhxEvent<any>);
          break;
        case "event":
          onPhxEvent(socket, rawPhxMessage as PhxEvent<unknown>);
          break;
        default:
          console.error("unhandeded event", event);
      }
    }
    else {
      // unknown message type
      console.error("unknown message type", rawPhxMessage);
    }

    // decode phx protocol
  });
});


function onPhxJoin(socket: any, message: PhxJoin) {
  // console.log("phx_join", message);
  // get current context for this socketid
  // render the view and send response
  const poc = new POCLiveViewComponent();
  const pocCtx = poc.mount({}, {}, { id: message[PhxSocketProtocolNames.topic] });
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
  socket.send(JSON.stringify(reply), { binary: false }, (err: any) => {
    if (err) {
      console.error("error", err)
    }
  });
}

function onPhxEvent(socket: any, message: PhxEvent<unknown>) {
  // update context
  // rerun render
  // send back dynamics if they changed
  // console.log('socket:', socket);
  console.log('event:', message);

  const [joinRef, messageRef, topic, event, payload] = message;

  const poc = new POCLiveViewComponent();

  const newPocCtx = poc.handleEvent(payload.event as PocEvent, payload.value, { id: topic });

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
  socket.send(JSON.stringify(reply), { binary: false }, (err: any) => {
    if (err) {
      console.error("error", err)
    }
  });
}

// @OnDisconnect()
// disconnect(@ConnectedSocket() socket: any) {
//   console.log('client disconnected');
// }

// }

function onHeartbeat(socket: any, message: PhxEvent<any>) {
  // console.log("heartbeat", message);

  const hbReply = newHeartbeatReply(message);

  // console.log("sending hbReply", hbReply);
  socket.send(JSON.stringify(hbReply), { binary: false }, (err: any) => {
    if (err) {
      console.error("error", err)
    }
  });
}

export { wsServer };