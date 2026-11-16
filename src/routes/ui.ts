export const uiRoutes = {
  editVm: (name: string) => `/instances/edit/${name}` as const,
  home: () => '/' as const,
  instances: () => '/instances' as const,
  newVm: () => '/instances/new' as const,
  theme: () => '/theme' as const,
};
