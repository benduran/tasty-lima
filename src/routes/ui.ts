export const uiRoutes = {
  home: () => '/' as const,
  instanceClone: (name: string) => `/instances/${name}/clone` as const,
  instanceConfig: (name: string) => `/instances/${name}/config` as const,
  instanceLogs: (name: string) => `/instances/${name}/logs` as const,
  instanceSsh: (name: string) => `/instances/${name}/ssh` as const,
  instances: () => '/instances' as const,
  newVm: () => '/instances/new' as const,
  templateEdit: (name: string) => `/templates/${name}/edit` as const,
  templateLaunch: (name: string) => `/templates/${name}/launch` as const,
  templateShare: (name: string) => `/templates/${name}/share` as const,
  templates: () => '/templates' as const,
  theme: () => '/theme' as const,
};
