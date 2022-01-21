// @ts-nocheck
import { Erlang } from './Erlang';

export const decodePayloadToTerm = (payload: string, callback: (err: any, term: any) => void): any => {
  const decoded = Buffer.from(payload, 'base64');
  // console.log('decoded', decoded);
  Erlang.binary_to_term(decoded, callback);
}