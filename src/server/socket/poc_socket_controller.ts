import {
  OnConnect,
  SocketController,
  ConnectedSocket,
  OnDisconnect,
  MessageBody,
  OnMessage,
} from 'socket-controllers';

@SocketController()
export class POCSocketController {
  @OnConnect()
  connection(@ConnectedSocket() socket: any) {
    console.log('client connected');
  }

  @OnDisconnect()
  disconnect(@ConnectedSocket() socket: any) {
    console.log('client disconnected');
  }

  @OnMessage('on')
  on(@ConnectedSocket() socket: any, @MessageBody() message: any) {
    console.log('socket:');
    console.log('message:', message);
    console.log('setting id to the message and sending it back to the client');
    message.id = 1;
    socket.emit('message_saved', message);
  }
}