import type { PropsWithChildren } from 'react';
import { createContext, useContext } from 'react';
import type { ClientSocket } from '../lib/client-socket.ts';
import type { Nullish } from '../shared/types.ts';

type ClientSocketProviderVal = {
  socket: ClientSocket;
};

const context = createContext<Nullish<ClientSocketProviderVal>>(null);

export function ClientSocketProvider({
  children,
  ...providerVal
}: ClientSocketProviderVal & PropsWithChildren) {
  return <context.Provider value={providerVal}>{children}</context.Provider>;
}

export function useClientSocket() {
  const ctx = useContext(context);
  if (!ctx) {
    throw new Error(
      'unable to useClientSocket() becuase no <ClientSocketProvider /> was found in the parent tree',
    );
  }

  return ctx;
}
