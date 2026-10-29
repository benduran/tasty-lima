const base = () => '/api' as const;
const instances = () => `${base()}/instances` as const;
const machineInfo = () => `${base()}/machine-info` as const;

export const apiRoutes = {
  instances,
  machineInfo,
};
