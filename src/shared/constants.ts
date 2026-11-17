export * from './constants.gen.ts';

export const SERVER_PORT = 60_010 as const;

export const SERVER_PORT_DEV = 60_011 as const;

export const API_TOKEN_HEADER = 'x-tasty-lima-token' as const;

export const API_TOKEN_PARAM = 't' as const;

export const API_WEBSOCKET_PROTOCOL = 'tasty-lima' as const;

// Bump this when a new version of limactl is released.
// tasty lima is clamped to specific versions of limactl, for compatibility
export const LIMA_VERSION = '2.3.0' as const;
