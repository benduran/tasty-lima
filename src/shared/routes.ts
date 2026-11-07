const base = () => '/api' as const;
const instances = () => `${base()}/instances` as const;
const localLimaTemplates = () => `${base()}/templates/local`;
const publicLimaTemplates = () => `${base()}/templates/public`;
const machineInfo = () => `${base()}/machine-info` as const;
const createInstance = () => `${instances()}/create`;

export const apiRoutes = {
  createInstance,
  instances,
  localLimaTemplates,
  machineInfo,
  publicLimaTemplates,
};
