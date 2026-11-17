import { z } from 'zod';
import { LimaTemplateSummarySchema } from './codecs.ts';
import {
  CreateLimaVMSchema,
  EditLimaVMSchema,
  LimaYAMLInputSchema,
} from './creator-types.ts';
import { LimaInstanceSchema } from './limactl-types.gen.ts';

export * from './creator-types.ts';
export * from './limactl-types.gen.ts';

export type Nullish<T> = T | null | undefined;

export const LogLevelSchema = z.enum(['error', 'info', 'warn']);
export type LogLevel = z.infer<typeof LogLevelSchema>;

export const LogLineSchema = z.object({
  level: LogLevelSchema,
  msg: z.string(),
  seq: z.int(),
  t: z.union([z.int(), z.string(), z.date()]),
});

export type LogLine = z.infer<typeof LogLineSchema>;

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

export const RequestIdSchema = z.uuidv4();

const BaseWebsocketSchema = z.object({
  requestId: RequestIdSchema,
});

export const DeleteInstanecResponseSchema = z.object({
  name: z.string().nonempty(),
});

export const BootInstanceRequestResponseSchema = z.object({
  degraded: z.boolean(),
  name: z.string().nonempty(),
});

export const ShutdownInstanceRequestResponseSchema = z.object({
  name: z.string().nonempty(),
});

export const ResponseInstanceConnectCommandSchema = z.object({
  command: z.string().nonempty(),
});

export const LimaBinResponse = z.object({
  binPath: z.string().nullish(),
});
export type ResponseInstanceConnectCommand = z.infer<
  typeof ResponseInstanceConnectCommandSchema
>;

export const ResponseInstanceYamlSchema = z.object({
  yaml: z.string().nonempty(),
});
export type ResponseInstanceYaml = z.infer<typeof ResponseInstanceYamlSchema>;

export const InstanceOperationRequestSchema = z.enum([
  'request-boot-instance',
  'request-create-instance',
  'request-edit-instance',
  'request-shutdown-instance',
]);
export type InstanceOperationRequest = z.infer<
  typeof InstanceOperationRequestSchema
>;

export const ResponseQueryInstanceSchema = z.object({
  config: LimaYAMLInputSchema.nullish(),
  instance: LimaInstanceSchema.nullish(),
});
export type RequestQueryInstance = z.infer<typeof ResponseQueryInstanceSchema>;

export const InstanceOperationSchema = z.object({
  data: z.unknown().optional(),
  error: z.string().optional(),
  finishedAt: z.int().optional(),
  lines: LogLineSchema.array(),
  name: z.string().nonempty(),
  request: InstanceOperationRequestSchema,
  requestId: RequestIdSchema,
  startedAt: z.int(),
});
export type InstanceOperation = z.infer<typeof InstanceOperationSchema>;

export const WebSocketMessageSchema = z.discriminatedUnion('type', [
  z.object({
    ...BaseWebsocketSchema.shape,
    sender: z.literal('client'),
    type: z.literal('request-heartbeat'),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    sender: z.literal('server'),
    type: z.literal('response-heartbeat'),
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
    data: z.object({ name: z.string().nonempty() }),
    sender: z.literal('client'),
    type: z.literal('request-query-instance'),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: ResponseQueryInstanceSchema,
    sender: z.literal('server'),
    type: z.literal('response-query-instance'),
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
    data: z.object({ name: z.string().nonempty() }),
    sender: z.literal('client'),
    type: z.literal('request-instance-connect-command'),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: ResponseInstanceConnectCommandSchema,
    sender: z.literal('server'),
    type: z.literal('response-instance-connect-command'),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: z.object({ name: z.string().nonempty() }),
    sender: z.literal('client'),
    type: z.literal('request-instance-yaml'),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: ResponseInstanceYamlSchema,
    sender: z.literal('server'),
    type: z.literal('response-instance-yaml'),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: CreateLimaVMSchema,
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
  z.object({
    ...BaseWebsocketSchema.shape,
    data: z.object({ name: z.string().nonempty() }),
    sender: z.literal('client'),
    type: z.literal('request-delete-instance'),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: DeleteInstanecResponseSchema,
    sender: z.literal('server'),
    type: z.literal('response-delete-instance'),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: z.object({
      lines: LogLineSchema.array(),
      name: z.string().nonempty(),
    }),
    sender: z.literal('server'),
    type: z.literal('stream-instance-logs'),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: InstanceOperationSchema.omit({ lines: true }),
    sender: z.literal('server'),
    type: z.literal('stream-instance-operation'),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    sender: z.literal('client'),
    type: z.literal('request-query-instance-operations'),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: InstanceOperationSchema.array(),
    sender: z.literal('server'),
    type: z.literal('response-query-instance-operations'),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: z.object({ name: z.string().nonempty() }),
    sender: z.literal('client'),
    type: z.literal('request-boot-instance'),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: BootInstanceRequestResponseSchema,
    sender: z.literal('server'),
    type: z.literal('response-boot-instance'),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: z.object({ name: z.string().nonempty() }),
    sender: z.literal('client'),
    type: z.literal('request-shutdown-instance'),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: ShutdownInstanceRequestResponseSchema,
    sender: z.literal('server'),
    type: z.literal('response-shutdown-instance'),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: EditLimaVMSchema,
    sender: z.literal('client'),
    type: z.literal('request-edit-instance'),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: BootInstanceRequestResponseSchema,
    sender: z.literal('server'),
    type: z.literal('response-edit-instance'),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    sender: z.literal('client'),
    type: z.literal('request-lima-bin'),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: LimaBinResponse,
    sender: z.literal('server'),
    type: z.literal('response-lima-bin'),
  }),
]);
export type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>;

export const UnreadableResponseSchema = z.object({
  requestId: z.string(),
  type: z.string().startsWith('response-'),
});

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

export const WsResponseMap = {
  'request-boot-instance': 'response-boot-instance',
  'request-create-instance': 'response-create-instance',
  'request-delete-instance': 'response-delete-instance',
  'request-edit-instance': 'response-edit-instance',
  'request-heartbeat': 'response-heartbeat',
  'request-instance-connect-command': 'response-instance-connect-command',
  'request-instance-yaml': 'response-instance-yaml',
  'request-lima-bin': 'response-lima-bin',
  'request-query-instance': 'response-query-instance',
  'request-query-instance-operations': 'response-query-instance-operations',
  'request-query-instances': 'response-query-instances',
  'request-query-machine-info': 'response-query-machine-info',
  'request-query-public-templates': 'response-query-public-templates',
  'request-shutdown-instance': 'response-shutdown-instance',
} as const satisfies WsResponseTypeShape;
export type WsResponseType = typeof WsResponseMap;

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
  return WsResponseMap[message.type] as WsResponseType[Message['type']];
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
