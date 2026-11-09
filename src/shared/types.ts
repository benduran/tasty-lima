import { z } from 'zod';
import { LimaTemplateSummarySchema } from './codecs.ts';
import { CreateLimaVMSchema } from './creator-types.ts';
import { LimaInstanceSchema } from './limactl-types.gen.ts';

export * from './creator-types.ts';
export * from './limactl-types.gen.ts';

export type Nullish<T> = T | null | undefined;

export const MachineInfoSchema = z.object({
  /**
   * CPU architecture used for this machine
   */
  arch: z.enum<NodeJS.Architecture[]>([
    'arm',
    'arm64',
    'ia32',
    'loong64',
    'mips',
    'mipsel',
    'ppc64',
    'riscv64',
    's390x',
    'x64',
  ]),
  /**
   * number of available cpus on the machine
   **/
  cpus: z.int().positive(),
  /**
   * amount, in gigabytes, available on the current mount point
   */
  diskSpace: z.int().positive(),
  /**
   * operating system for the machine
   */
  platform: z.enum<NodeJS.Platform[]>([
    'aix',
    'android',
    'cygwin',
    'darwin',
    'freebsd',
    'haiku',
    'linux',
    'netbsd',
    'openbsd',
    'sunos',
    'win32',
  ]),
  /**
   * in gigabytes
   */
  ram: z.int().positive(),
});
export type MachineInfo = z.infer<typeof MachineInfoSchema>;

const BaseWebsocketSchema = z.object({
  requestId: z.uuidv4(),
});

export const WebSocketMessageSchema = z.discriminatedUnion('type', [
  z.object({
    ...BaseWebsocketSchema.shape,
    sender: z.literal('server'),
    type: z.literal('pulse'),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    sender: z.literal('client'),
    type: z.literal('heartbeat'),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    sender: z.literal('client'),
    type: z.literal('request-query-instances'),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: LimaInstanceSchema.array(),
    sender: z.literal('server'),
    type: z.literal('response-query-instances'),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    sender: z.literal('client'),
    type: z.literal('request-query-machine-info'),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: MachineInfoSchema,
    sender: z.literal('server'),
    type: z.literal('response-query-machine-info'),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    sender: z.literal('client'),
    type: z.literal('request-query-public-templates'),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: LimaTemplateSummarySchema.array(),
    sender: z.literal('server'),
    type: z.literal('response-query-public-templates'),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    createLimaVM: CreateLimaVMSchema,
    sender: z.literal('client'),
    type: z.literal('request-create-instance'),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: LimaInstanceSchema,
    sender: z.literal('server'),
    type: z.literal('response-create-instance'),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    message: z.string(),
    sender: z.literal('server'),
    type: z.literal('response-error'),
  }),
]);
export type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>;

/**
 * Client -> server messages that expect a response.
 */
export type WsRequestMessage = Extract<WebSocketMessage, { sender: 'client' }>;

/**
 * Server -> client messages that answer a request.
 */
export type WsResponseMessage = Extract<WebSocketMessage, { sender: 'server' }>;

type RequestSuffix =
  Extract<
    WsRequestMessage['type'],
    `request-${string}`
  > extends `request-${infer Suffix}`
    ? Suffix
    : never;
type ResponseSuffix =
  Extract<
    WsResponseMessage['type'],
    `response-${string}`
  > extends `response-${infer Suffix}`
    ? Suffix
    : never;

/** suffixes that exist on both a request name and a response name, from the schema union */
type SharedSuffix = RequestSuffix & ResponseSuffix;

/**
 * Requires exactly one map entry per shared suffix, and each value to reuse
 * its key's suffix: request-query-instances maps to response-query-instances
 * and nothing else, all derived from the schema union.
 */
type WsResponseTypeShape = {
  [Suffix in SharedSuffix as `request-${Suffix}`]: `response-${Suffix}`;
};

export const WsResponseType = {
  'request-create-instance': 'response-create-instance',
  'request-query-instances': 'response-query-instances',
  'request-query-machine-info': 'response-query-machine-info',
  'request-query-public-templates': 'response-query-public-templates',
} as const satisfies WsResponseTypeShape;
export type WsResponseType = typeof WsResponseType;

/** request message names, verified by WsResponseTypeShape to pair with a response */
export type WsRequestMessageName = keyof WsResponseType;

/**
 * Request bodies as callers build them: a WsRequestMessage without a
 * requestId, which websocketFetch stamps on send.
 */
type StripRequestId<Message> = Message extends {
  requestId: string;
}
  ? Omit<Message, 'requestId'>
  : never;
export type WsRequestMessageBody = StripRequestId<WsRequestMessage>;

/**
 * The response name that answers a given request message.
 */
export function responseNameOf<Message extends { type: WsRequestMessageName }>(
  message: Message,
): WsResponseType[Message['type']] {
  return WsResponseType[message.type] as WsResponseType[Message['type']];
}

export const WebSocketMessageCodec = z.codec(
  z.string().nonempty().nonoptional(),
  WebSocketMessageSchema,
  {
    decode(str) {
      return JSON.parse(str);
    },
    encode(obj) {
      return JSON.stringify(obj);
    },
  },
);
