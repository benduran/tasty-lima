import { useQueryClient } from '@tanstack/react-query';
import type { SubmitEvent } from 'react';
import { useCallback, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { useCreateInstance } from '../../hooks/use-create-instance.ts';
import { useQueryMachineInfo } from '../../hooks/use-query-machine-info.ts';
import { useQueryPublicTemplates } from '../../hooks/use-query-public-templates.ts';
import { uiRoutes } from '../../routes/index.ts';
import { LimaYAMLInputCodec } from '../../shared/codecs.ts';
import {
  PortNumberSchema,
  UserNameSchema,
} from '../../shared/creator-types.ts';
import { errorToString } from '../../shared/error-to-string.ts';
import type {
  LimaMount,
  LimaMountType,
  LimaSSH,
  LimaUser,
  LimaVMType,
  LimaYAMLInput,
  Nullish,
  PortForwardInput,
} from '../../shared/types.ts';
import {
  CreateLimaVMSchema,
  LimaArchSchema,
  LimaMountTypeSchema,
  LimaVMTypeSchema,
} from '../../shared/types.ts';
import {
  bareNumberStrToGiBStr,
  GiBStringToBareNumberStr,
  isNullOrUndefined,
  machineInfoArchToLimaArch,
  templateLocator,
  templateNameFromBase,
  withValidatedField,
} from '../../shared/util.ts';
import {
  useNewVMStore,
  useResetNewVMStore,
} from '../../stores/new-vm-store.ts';
import { isPlaceholderProvision } from '../provision-scripts-table.tsx';
import { toast } from '../ui/toast.tsx';

const INSTANCE_QUERY_KEY = ['useQueryInstances'] as const;

const WSL2_TEMPLATE_NAME = 'experimental/wsl2';

/** mount types each lima driver accepts (lima 2.3.0) */
function mountTypesFor(
  vmType: LimaVMType,
  platform: Nullish<string>,
): LimaMountType[] {
  if (vmType === 'wsl2') return ['wsl2'];
  if (vmType === 'vz') return ['virtiofs', 'reverse-sshfs'];
  switch (platform) {
    case 'win32':
      /** QEMU on Windows supports no other mount type (notably no 9p) */
      return ['reverse-sshfs'];
    case 'darwin':
      return ['9p', 'reverse-sshfs'];
    default:
      return ['9p', 'reverse-sshfs', 'virtiofs'];
  }
}

/** the default a lima driver resolves when `mountType` is left unset */
function defaultMountTypeFor(
  vmType: LimaVMType,
  platform: Nullish<string>,
): LimaMountType | undefined {
  if (vmType === 'wsl2') return 'wsl2';
  if (vmType === 'vz') return 'virtiofs';
  if (platform === 'win32') return 'reverse-sshfs';
  /** lima resolves 9p for QEMU on other hosts */
  return undefined;
}

/* Sole owner of the new-VM draft state; only vm-settings-form may use this. */
export function useVmSettings() {
  /** queries */
  const { data: machineInfo } = useQueryMachineInfo();
  const { data: templates, isPending: templatesPending } =
    useQueryPublicTemplates();
  const { isPending: isCreating, mutate: createInstance } = useCreateInstance();

  /** routing */
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  /** store */
  const resetNewVmStore = useResetNewVMStore();
  const [name, setName] = useNewVMStore('name');
  const [base, setBase] = useNewVMStore('config.base');
  const [arch, setArch] = useNewVMStore('config.arch');
  const [vmType, setVmType] = useNewVMStore('config.vmType');
  const [mounts, setMounts] = useNewVMStore('config.mounts');
  const [cpus, setCpus] = useNewVMStore('config.cpus');
  const [ram, setRam] = useNewVMStore('config.memory');
  const [mountType, setMountType] = useNewVMStore('config.mountType');
  const [disk, setDisk] = useNewVMStore('config.disk');
  const [portForwards, setPortForwards] = useNewVMStore('config.portForwards');
  const [provision, setProvision] = useNewVMStore('config.provision');
  const [ssh, setSSH] = useNewVMStore('config.ssh');
  const [user, setUser] = useNewVMStore('config.user');
  const [config, setConfig] = useNewVMStore('config');
  const [configMode, setConfigMode] = useNewVMStore('configMode');
  const [rawYaml, setRawYaml] = useNewVMStore('rawYaml');

  /** memos */
  const currentMachineArch = useMemo(
    () => machineInfoArchToLimaArch(machineInfo?.arch),
    [machineInfo?.arch],
  );
  const selectedTemplate = useMemo(() => templateNameFromBase(base), [base]);

  const parsed = useMemo(
    () =>
      configMode === 'yaml'
        ? LimaYAMLInputCodec.safeDecode(rawYaml || '')
        : null,
    [configMode, rawYaml],
  );
  const yamlError = useMemo(
    () => (parsed && !parsed.success ? z.prettifyError(parsed.error) : null),
    [parsed],
  );
  const nameValid = useMemo(
    () => CreateLimaVMSchema.shape.name.safeParse(name).success,
    [name],
  );

  const sshDraft: LimaSSH = ssh ?? {};
  const userDraft: LimaUser = user ?? {};

  const canCreate = useMemo(
    () => nameValid && !isCreating && (!parsed || parsed.success),
    [isCreating, parsed, nameValid],
  );

  /** callbacks */
  const onAddScript = useCallback(
    (isBoot: boolean) =>
      setProvision(prev => [
        ...(prev ?? []),
        isBoot ? { mode: 'boot', script: '' } : { mode: 'system', script: '' },
      ]),
    [setProvision],
  );

  const onChangeScript = useCallback(
    (index: number, script: string) =>
      setProvision(prev =>
        prev?.map((p, i) => (index === i ? { ...p, script } : p)),
      ),
    [setProvision],
  );

  const onRemoveScript = useCallback(
    (index: number) =>
      setProvision(prev => prev?.filter((_, i) => index !== i)),
    [setProvision],
  );

  const onAddMount = useCallback(
    () => setMounts(prev => [...(prev ?? []), { location: '' }]),
    [setMounts],
  );

  const onChangeMount = useCallback(
    (index: number, mount: LimaMount) =>
      setMounts(prev => prev?.map((m, i) => (index === i ? mount : m))),
    [setMounts],
  );

  const onRemoveMount = useCallback(
    (index: number) => setMounts(prev => prev?.filter((_, i) => index !== i)),
    [setMounts],
  );

  const onAddPortForward = useCallback(
    () => setPortForwards(prev => [...(prev ?? []), {}]),
    [setPortForwards],
  );

  const onChangePortForward = useCallback(
    (index: number, portForward: PortForwardInput) =>
      setPortForwards(prev =>
        prev?.map((pf, i) => (index === i ? portForward : pf)),
      ),
    [setPortForwards],
  );

  const onRemovePortForward = useCallback(
    (index: number) =>
      setPortForwards(prev => prev?.filter((_, i) => index !== i)),
    [setPortForwards],
  );

  const buildSubmitConfig = useCallback(
    (): LimaYAMLInput => ({
      ...config,
      disk: bareNumberStrToGiBStr(config?.disk),
      memory: bareNumberStrToGiBStr(config?.memory),
      provision: (config?.provision ?? []).filter(
        provisionEntry => !isPlaceholderProvision(provisionEntry),
      ),
    }),
    [config],
  );

  const switchMode = useCallback(
    (next: string) => {
      if (next === configMode || (next !== 'form' && next !== 'yaml')) return;

      if (next === 'yaml') {
        try {
          setRawYaml(LimaYAMLInputCodec.encode(buildSubmitConfig()));
        } catch (error) {
          toast.add({
            description: errorToString(error),
            title: 'The current draft cannot be serialized to YAML',
            type: 'error',
          });
          return;
        }
        setConfigMode('yaml');
        return;
      }

      const result = LimaYAMLInputCodec.safeDecode(rawYaml || '');
      if (!result.success) return;

      /* the form's store holds bare GiB numbers, so strip the unit suffixes
         the YAML draft may carry */
      setConfig({
        ...result.data,
        disk: GiBStringToBareNumberStr(result.data.disk),
        memory: GiBStringToBareNumberStr(result.data.memory),
      });
      setConfigMode('form');
    },
    [
      buildSubmitConfig,
      configMode,
      rawYaml,
      setConfig,
      setConfigMode,
      setRawYaml,
    ],
  );

  const handleCreate = useCallback(
    (start: boolean) => {
      let submission: LimaYAMLInput;
      if (configMode === 'yaml') {
        if (!parsed?.success) return;
        submission = parsed.data;
      } else {
        submission = buildSubmitConfig();
      }

      createInstance(
        {
          config: submission,
          name: (name ?? '').trim(),
          startAfterCreate: start,
        },
        {
          onSuccess: () => {
            void queryClient.invalidateQueries({
              queryKey: INSTANCE_QUERY_KEY,
            });
            resetNewVmStore();
            setLocation(uiRoutes.instances());
          },
        },
      );
    },
    [
      buildSubmitConfig,
      configMode,
      createInstance,
      name,
      parsed,
      queryClient,
      resetNewVmStore,
      setLocation,
    ],
  );

  const handleFormSubmit = useCallback(
    (event: SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (canCreate) handleCreate(false);
    },
    [canCreate, handleCreate],
  );

  const handleCancel = useCallback(
    () => setLocation(uiRoutes.instances()),
    [setLocation],
  );

  const handleCreateAndBoot = useCallback(
    () => handleCreate(true),
    [handleCreate],
  );

  const setRamFromMeter = useCallback(
    (newVal: number) => setRam(String(newVal)),
    [setRam],
  );

  const setDiskFromMeter = useCallback(
    (newVal: number) => setDisk(String(newVal)),
    [setDisk],
  );

  const setCpusFromMeter = useCallback(
    (newVal: number) => setCpus(newVal),
    [setCpus],
  );

  const setBaseFromTemplate = useCallback(
    (templateName: string) => setBase([{ url: templateLocator(templateName) }]),
    [setBase],
  );

  const onArchChange = useCallback(
    (value: string) => {
      const validated = LimaArchSchema.safeParse(value);
      if (validated.success) {
        setArch(validated.data);
      }
    },
    [setArch],
  );

  const onVmTypeChange = useCallback(
    (value: string) => {
      const validated = LimaVMTypeSchema.safeParse(value);
      if (!validated.success) return;

      setVmType(validated.data);
      /** the WSL2 driver can only boot rootfs tarballs */
      if (validated.data === 'wsl2') {
        if (selectedTemplate !== WSL2_TEMPLATE_NAME) {
          setBaseFromTemplate(WSL2_TEMPLATE_NAME);
        }
      } else if (selectedTemplate === WSL2_TEMPLATE_NAME) {
        setBaseFromTemplate('default');
      }
    },
    [selectedTemplate, setBaseFromTemplate, setVmType],
  );

  const onMountTypeChange = useCallback(
    (value: string) => {
      if (value === 'auto') {
        setMountType(undefined);
        return;
      }

      const validated = LimaMountTypeSchema.safeParse(value);
      if (validated.success) {
        setMountType(validated.data);
      }
    },
    [setMountType],
  );

  const onSSHLocalPortChange = useCallback(
    (rawValue: string) =>
      setSSH(
        withValidatedField(sshDraft, 'localPort', rawValue, PortNumberSchema),
      ),
    [setSSH, sshDraft],
  );

  const onUserNameChange = useCallback(
    (rawValue: string) =>
      setUser(withValidatedField(userDraft, 'name', rawValue, UserNameSchema)),
    [setUser, userDraft],
  );

  const onForwardAgentChange = useCallback(
    (forwardAgent: boolean) => setSSH({ ...sshDraft, forwardAgent }),
    [setSSH, sshDraft],
  );

  const onLoadDotSSHPubKeysChange = useCallback(
    (loadDotSSHPubKeys: boolean) => setSSH({ ...sshDraft, loadDotSSHPubKeys }),
    [setSSH, sshDraft],
  );

  /** vz is macOS-only (Apple Virtualization), but qemu works everywhere.
   *  wsl2 is lima's experimental Windows driver */
  const vmTypes = useMemo<Array<{ desc: string; value: LimaVMType }>>(() => {
    if (machineInfo?.platform === 'win32') {
      return [
        { desc: 'QEMU', value: 'qemu' },
        { desc: 'WSL2 (experimental)', value: 'wsl2' },
      ];
    }
    if (machineInfo?.platform === 'darwin') {
      return [
        { desc: 'Apple Virtualization', value: 'vz' },
        { desc: 'QEMU', value: 'qemu' },
      ];
    }
    return [{ desc: 'QEMU', value: 'qemu' }];
  }, [machineInfo?.platform]);

  /** mount types the selected driver accepts; the picker hides the rest */
  const mountTypes = useMemo(
    () => (vmType ? mountTypesFor(vmType, machineInfo?.platform) : []),
    [machineInfo?.platform, vmType],
  );

  /** vz can only run the native arch, so it dims when the choice emulates */
  const vzOff =
    !isNullOrUndefined(arch) &&
    !isNullOrUndefined(currentMachineArch) &&
    arch !== currentMachineArch;

  /** effects */
  useEffect(() => {
    if (base?.length) return;

    setBase([{ url: templateLocator('default') }]);
  }, [base, setBase]);

  useEffect(() => {
    if (arch || !currentMachineArch) return;

    setArch(currentMachineArch);
  }, [arch, currentMachineArch, setArch]);

  useEffect(() => {
    if (vmType || !machineInfo) return;

    setVmType(machineInfo.platform === 'darwin' ? 'vz' : 'qemu');
  }, [machineInfo, setVmType, vmType]);

  useEffect(() => {
    if (vmType !== 'vz' || !arch || !currentMachineArch) return;

    if (arch !== currentMachineArch) setVmType('qemu');
  }, [arch, currentMachineArch, setVmType, vmType]);

  useEffect(() => {
    setCpus(1);
    setRam(String(1));
    setDisk(String(10));
  }, [setCpus, setRam, setDisk]);

  /** keep the mount type compatible with the selected driver */
  useEffect(() => {
    if (!vmType || !machineInfo) return;

    const valid = mountTypesFor(vmType, machineInfo.platform);
    if (mountType && valid.includes(mountType)) return;

    setMountType(defaultMountTypeFor(vmType, machineInfo.platform));
  }, [machineInfo, mountType, setMountType, vmType]);

  useEffect(() => () => resetNewVmStore(), [resetNewVmStore]);

  return {
    /** image section */
    arch,
    /** mode + validation */
    canCreate,
    configMode,
    /** resources section */
    cpus,
    currentMachineArch,
    disk,
    isCreating,
    machineInfo,
    mounts: mounts ?? [],
    /** mounts section */
    mountType,
    mountTypes,
    /** name */
    name,
    onAddMount,
    /** port overrides section */
    onAddPortForward,
    /** provision scripts section */
    onAddScript,
    onArchChange,
    onCancel: handleCancel,
    onChangeMount,
    onChangePortForward,
    onChangeScript,
    onCpusChange: setCpusFromMeter,
    /** submit */
    onCreateAndBoot: handleCreateAndBoot,
    onDiskMeterChange: setDiskFromMeter,
    onFormSubmit: handleFormSubmit,
    /** ssh section */
    onForwardAgentChange,
    onLoadDotSSHPubKeysChange,
    onMountTypeChange,
    onNameChange: setName,
    onRamMeterChange: setRamFromMeter,
    /** yaml editor */
    onRawYamlChange: setRawYaml,
    onRemoveMount,
    onRemovePortForward,
    onRemoveScript,
    onSSHLocalPortChange,
    onTemplateSelect: setBaseFromTemplate,
    onUserNameChange,
    onVmTypeChange,
    portForwards: portForwards ?? [],
    provision: provision ?? [],
    ram,
    rawYaml,
    selectedTemplate,
    ssh: sshDraft,
    switchMode,
    templates,
    templatesPending,
    user: userDraft,
    vmType,
    vmTypes,
    vzOff,
    yamlError,
  };
}
