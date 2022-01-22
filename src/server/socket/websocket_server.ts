import { PhxReply, PhxSocketProtocolNames, RenderedNode, PhxOutgoingMessage, newHeartbeatReply, PhxJoinIncoming, PhxHeartbeatIncoming, PhxClickEvent, PhxFormEvent, PhxIncomingMessage, PhxClickPayload, PhxFormPayload } from './types';
import ws from 'ws';
import { router } from '../live/router';
import qs from 'querystring';
import { URLSearchParams } from 'url';

const wsServer = new ws.Server({
  port: 3003,
});

const topicToPath: { [key: string]: string } = {}

wsServer.on('connection', socket => {
  // console.log("socket connected", socket);

  socket.on('message', message => {
    console.log("message", String(message));
    // get raw message to string
    const stringMsg = message.toString();
    // console.log("message", stringMsg);

    // parse string to JSON
    const rawPhxMessage: PhxIncomingMessage<unknown> = JSON.parse(stringMsg);
    // console.log("rawPhxMessage", rawPhxMessage);

    // rawPhxMessage must be an array with 5 elements
    if (typeof rawPhxMessage === 'object' && Array.isArray(rawPhxMessage) && rawPhxMessage.length === 5) {
      const [joinRef, messageRef, topic, event, payload] = rawPhxMessage;
      switch (event) {
        case "phx_join":
          onPhxJoin(socket, rawPhxMessage as PhxJoinIncoming);
          break;
        case "heartbeat":
          onHeartbeat(socket, rawPhxMessage as PhxHeartbeatIncoming);
          break;
        case "event":
          // map based on event type
          const { type } = payload as PhxClickPayload | PhxFormPayload
          console
          switch (type) {
            case "click":
              onPhxClickEvent(socket, rawPhxMessage as PhxClickEvent);
              break;
            case "form":
              onPhxFormEvent(socket, rawPhxMessage as PhxFormEvent);
              break;
            default:
              console.error("unhandeded event type", type);
          }
          break;
        default:
          console.error("unhandeded protocol event", event);
      }
    }
    else {
      // unknown message type
      console.error("unknown message type", rawPhxMessage);
    }

    // decode phx protocol
  });
});


function onPhxJoin(socket: any, message: PhxJoinIncoming) {
  // console.log("phx_join", message);

  // use url to route join request to component
  const [joinRef, messageRef, topic, event, payload] = message;
  const url = new URL(payload.url);
  const component = router[url.pathname];
  if (!component) {
    console.error("no component found for", url);
    return;
  }

  // update topicToPath
  topicToPath[topic] = url.pathname;

  const ctx = component.mount({}, {}, { id: message[PhxSocketProtocolNames.topic] });
  const view = component.render(ctx);

  // map array of dynamics to object with indiceies as keys
  const dynamics = view.dynamics.reduce((acc: { [key: number]: unknown }, cur, index: number) => {
    acc[index] = cur;
    return acc;
  }, {} as { [key: number]: unknown })

  const rendered: RenderedNode = {
    ...dynamics,
    s: view.statics
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

function onPhxFormEvent(socket: any, message: PhxFormEvent) {
  // update context
  // rerun render
  // send back dynamics if they changed
  // console.log('socket:', socket);
  console.log('event:', message);

  const [joinRef, messageRef, topic, event, payload] = message;

  // route using topic to lookup path
  const path = topicToPath[topic];
  const component = router[path];
  if (!component) {
    console.error("no mapping found topic", topic);
    return;
  }

  // check if component has event handler
  if(!(component as any).handleEvent) {
    console.warn("no event handler for component", component);
    return;
  }

  const { type, event: payloadEvent, value } = payload;
  const params = new URLSearchParams(value);
  // TODO update types to have optional handleEvent???
  // @ts-ignore
  const ctx = component.handleEvent(payload.event, Object.fromEntries(params), { id: topic });

  const view = component.render(ctx);

  // map array of dynamics to object with indiceies as keys
  const dynamics = view.dynamics.reduce((acc: { [key: number]: string }, cur: string, index: number) => {
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
  // console.log("sending phx_reply", reply);
  socket.send(JSON.stringify(reply), { binary: false }, (err: any) => {
    if (err) {
      console.error("error", err)
    }
  });
}

function onPhxClickEvent(socket: any, message: PhxClickEvent) {
  // update context
  // rerun render
  // send back dynamics if they changed
  // console.log('socket:', socket);
  console.log('event:', message);

  const [joinRef, messageRef, topic, event, payload] = message;

  // route using topic to lookup path
  const path = topicToPath[topic];
  const component = router[path];
  if (!component) {
    console.error("no mapping found topic", topic);
    return;
  }

  // check if component has event handler
  if(!(component as any).handleEvent) {
    console.warn("no event handler for component", component);
    return;
  }

  const { type, event: payloadEvent, value } = payload;
  // TODO update types to have optional handleEvent???
  // @ts-ignore
  const ctx = component.handleEvent(payload.event, value.value, { id: topic });

  const view = component.render(ctx);

  // map array of dynamics to object with indiceies as keys
  const dynamics = view.dynamics.reduce((acc: { [key: number]: string }, cur: string, index: number) => {
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
  // console.log("sending phx_reply", reply);
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

function onHeartbeat(socket: any, message: PhxHeartbeatIncoming) {
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