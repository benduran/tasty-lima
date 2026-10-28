const base = () => '/api' as const;
const instances = () => `${base()}/instances` as const;

export const apiRoutes = {
  instances,
};
