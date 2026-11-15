import type {} from '@tanstack/react-query';
import type { InstanceOperationRequest } from '../shared/types.ts';

declare module '@tanstack/react-query' {
  // biome-ignore lint/style/useConsistentTypeDefinitions: module augmentation of Register requires an interface
  interface Register {
    queryMeta: {
      /** Opt out of the global error toast in TastyLimaProviders. */
      suppressErrorToast?: boolean;
      /** Override the default 'Request failed' toast title. */
      errorTitle?: string;
    };
    mutationMeta: {
      /** Opt out of the global error toast in TastyLimaProviders. */
      suppressErrorToast?: boolean;
      /**
       * Toast title; a function receives the mutation's `variables`.
       * Typed as `never` so any concrete variables type fits.
       */
      errorTitle?: string | ((variables: never) => string);
      operation?: InstanceOperationRequest;
    };
  }
}
