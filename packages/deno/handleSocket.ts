import { acceptWebSocket, acceptable } from './deps.ts'

export const handleSocket = async (ctx: any) => {
    if (acceptable(ctx.request.serverRequest)) {
      const { conn, r: bufReader, w: bufWriter, headers } = ctx.request.serverRequest;
      const socket = await acceptWebSocket({
        conn,
        bufReader,
        bufWriter,
        headers,
      });
      console.log("socket", socket)
    } else {
      throw new Error('Error when connecting websocket');
    }
  }