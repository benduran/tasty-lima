const base = () => '/api' as const;
const instances = () => `${base()}/instances` as const;
const localLimaTemplates = () => `${base()}/templates/local`;
const publicLimaTemplates = () => `${base()}/templates/public`;
const machineInfo = () => `${base()}/machine-info` as const;

export const apiRoutes = {
  instances,
  localLimaTemplates,
  machineInfo,
  publicLimaTemplates,
};
