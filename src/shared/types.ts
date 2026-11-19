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

export const LimaNetworkDefinitionSchema = z.object({
  mode: z.string().nonempty(),
  name: z.string().nonempty(),
});
export type LimaNetworkDefinition = z.infer<typeof LimaNetworkDefinitionSchema>;

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

const WebSocketRequestMessageTypes = {
  bootInstance: 'request-boot-instance',
  createInstance: 'request-create-instance',
  deleteInstance: 'request-delete-instance',
  editInstance: 'request-edit-instance',
  heartbeat: 'request-heartbeat',
  instanceYaml: 'request-instance-yaml',
  queryConnectCommand: 'request-instance-connect-command',
  queryInstance: 'request-query-instance',
  queryInstanceOperations: 'request-query-instance-operations',
  queryInstances: 'request-query-instances',
  queryLimaBin: 'request-lima-bin',
  queryMachineInfo: 'request-query-machine-info',
  queryNetworks: 'request-query-networks',
  queryTemplates: 'request-query-public-templates',
  shutdownInstance: 'request-shutdown-instance',
} as const;

export const InstanceOperationRequestSchema = z.enum([
  WebSocketRequestMessageTypes.bootInstance,
  WebSocketRequestMessageTypes.createInstance,
  WebSocketRequestMessageTypes.deleteInstance,
  WebSocketRequestMessageTypes.editInstance,
  WebSocketRequestMessageTypes.shutdownInstance,
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

const WebSocketServerMessageTypes = {
  bootInstance: 'response-boot-instance',
  createInstance: 'response-create-instance',
  deleteInstance: 'response-delete-instance',
  editInstance: 'response-edit-instance',
  error: 'response-error',
  heartbeat: 'response-heartbeat',
  instanceYaml: 'response-instance-yaml',
  queryConnectCommand: 'response-instance-connect-command',
  queryInstance: 'response-query-instance',
  queryInstanceOperations: 'response-query-instance-operations',
  queryInstances: 'response-query-instances',
  queryLimaBin: 'response-lima-bin',
  queryMachineInfo: 'response-query-machine-info',
  queryNetworks: 'response-query-networks',
  queryTemplates: 'response-query-public-templates',
  shutdownInstance: 'response-shutdown-instance',
  streamInstanceLogs: 'stream-instance-logs',
  streamInstanceOperation: 'stream-instance-operation',
} as const;

export const WebSocketMessageSchema = z.discriminatedUnion('type', [
  z.object({
    ...BaseWebsocketSchema.shape,
    sender: z.literal('client'),
    type: z.literal(WebSocketRequestMessageTypes.heartbeat),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    sender: z.literal('server'),
    type: z.literal(WebSocketServerMessageTypes.heartbeat),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    sender: z.literal('client'),
    type: z.literal(WebSocketRequestMessageTypes.queryInstances),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: LimaInstanceSchema.array(),
    sender: z.literal('server'),
    type: z.literal(WebSocketServerMessageTypes.queryInstances),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: z.object({ name: z.string().nonempty() }),
    sender: z.literal('client'),
    type: z.literal(WebSocketRequestMessageTypes.queryInstance),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: ResponseQueryInstanceSchema,
    sender: z.literal('server'),
    type: z.literal(WebSocketServerMessageTypes.queryInstance),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    sender: z.literal('client'),
    type: z.literal(WebSocketRequestMessageTypes.queryMachineInfo),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: MachineInfoSchema,
    sender: z.literal('server'),
    type: z.literal(WebSocketServerMessageTypes.queryMachineInfo),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    sender: z.literal('client'),
    type: z.literal(WebSocketRequestMessageTypes.queryNetworks),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: LimaNetworkDefinitionSchema.array(),
    sender: z.literal('server'),
    type: z.literal(WebSocketServerMessageTypes.queryNetworks),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    sender: z.literal('client'),
    type: z.literal(WebSocketRequestMessageTypes.queryTemplates),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: LimaTemplateSummarySchema.array(),
    sender: z.literal('server'),
    type: z.literal(WebSocketServerMessageTypes.queryTemplates),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: z.object({ name: z.string().nonempty() }),
    sender: z.literal('client'),
    type: z.literal(WebSocketRequestMessageTypes.queryConnectCommand),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: ResponseInstanceConnectCommandSchema,
    sender: z.literal('server'),
    type: z.literal(WebSocketServerMessageTypes.queryConnectCommand),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: z.object({ name: z.string().nonempty() }),
    sender: z.literal('client'),
    type: z.literal(WebSocketRequestMessageTypes.instanceYaml),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: ResponseInstanceYamlSchema,
    sender: z.literal('server'),
    type: z.literal(WebSocketServerMessageTypes.instanceYaml),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: CreateLimaVMSchema,
    sender: z.literal('client'),
    type: z.literal(WebSocketRequestMessageTypes.createInstance),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: LimaInstanceSchema,
    sender: z.literal('server'),
    type: z.literal(WebSocketServerMessageTypes.createInstance),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    message: z.string(),
    sender: z.literal('server'),
    type: z.literal(WebSocketServerMessageTypes.error),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: z.object({ name: z.string().nonempty() }),
    sender: z.literal('client'),
    type: z.literal(WebSocketRequestMessageTypes.deleteInstance),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: DeleteInstanecResponseSchema,
    sender: z.literal('server'),
    type: z.literal(WebSocketServerMessageTypes.deleteInstance),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: z.object({
      lines: LogLineSchema.array(),
      name: z.string().nonempty(),
    }),
    sender: z.literal('server'),
    type: z.literal(WebSocketServerMessageTypes.streamInstanceLogs),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: InstanceOperationSchema.omit({ lines: true }),
    sender: z.literal('server'),
    type: z.literal(WebSocketServerMessageTypes.streamInstanceOperation),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    sender: z.literal('client'),
    type: z.literal(WebSocketRequestMessageTypes.queryInstanceOperations),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: InstanceOperationSchema.array(),
    sender: z.literal('server'),
    type: z.literal(WebSocketServerMessageTypes.queryInstanceOperations),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: z.object({ name: z.string().nonempty() }),
    sender: z.literal('client'),
    type: z.literal(WebSocketRequestMessageTypes.bootInstance),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: BootInstanceRequestResponseSchema,
    sender: z.literal('server'),
    type: z.literal(WebSocketServerMessageTypes.bootInstance),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: z.object({ name: z.string().nonempty() }),
    sender: z.literal('client'),
    type: z.literal(WebSocketRequestMessageTypes.shutdownInstance),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: ShutdownInstanceRequestResponseSchema,
    sender: z.literal('server'),
    type: z.literal(WebSocketServerMessageTypes.shutdownInstance),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: EditLimaVMSchema,
    sender: z.literal('client'),
    type: z.literal(WebSocketRequestMessageTypes.editInstance),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: BootInstanceRequestResponseSchema,
    sender: z.literal('server'),
    type: z.literal(WebSocketServerMessageTypes.editInstance),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    sender: z.literal('client'),
    type: z.literal(WebSocketRequestMessageTypes.queryLimaBin),
  }),
  z.object({
    ...BaseWebsocketSchema.shape,
    data: LimaBinResponse,
    sender: z.literal('server'),
    type: z.literal(WebSocketServerMessageTypes.queryLimaBin),
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
  'request-boot-instance': WebSocketServerMessageTypes.bootInstance,
  'request-create-instance': WebSocketServerMessageTypes.createInstance,
  'request-delete-instance': WebSocketServerMessageTypes.deleteInstance,
  'request-edit-instance': WebSocketServerMessageTypes.editInstance,
  'request-heartbeat': WebSocketServerMessageTypes.heartbeat,
  'request-instance-connect-command':
    WebSocketServerMessageTypes.queryConnectCommand,
  'request-instance-yaml': WebSocketServerMessageTypes.instanceYaml,
  'request-lima-bin': WebSocketServerMessageTypes.queryLimaBin,
  'request-query-instance': WebSocketServerMessageTypes.queryInstance,
  'request-query-instance-operations':
    WebSocketServerMessageTypes.queryInstanceOperations,
  'request-query-instances': WebSocketServerMessageTypes.queryInstances,
  'request-query-machine-info': WebSocketServerMessageTypes.queryMachineInfo,
  'request-query-networks': WebSocketServerMessageTypes.queryNetworks,
  'request-query-public-templates': WebSocketServerMessageTypes.queryTemplates,
  'request-shutdown-instance': WebSocketServerMessageTypes.shutdownInstance,
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
