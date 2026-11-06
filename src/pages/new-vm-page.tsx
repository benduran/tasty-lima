import { Fragment, useEffect, useMemo } from 'react';
import { CheckboxRow } from '../components/checkbox-row.tsx';
import { CrtFieldset, CrtOption, CrtSection } from '../components/crt.tsx';
import { LabeledField } from '../components/labeled-field.tsx';
import { MountsTable } from '../components/mounts-table.tsx';
import { PortsTable } from '../components/ports-table.tsx';
import { ResourceMeter } from '../components/resource-meter.tsx';
import { TemplatePicker } from '../components/template-picker.tsx';
import { Input } from '../components/ui/input.tsx';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group.tsx';
import { useQueryMachineInfo } from '../hooks/use-query-machine-info.ts';
import { useQueryPublicTemplates } from '../hooks/use-query-public-templates.ts';
import { PageLayout } from '../layouts/PageLayout.tsx';
import { uiRoutes } from '../routes/ui.ts';
import { PortNumberSchema, UserNameSchema } from '../shared/creator-types.ts';
import type {
  LimaSSH,
  LimaUser,
  LimaVMType,
} from '../shared/limactl-types.gen.ts';
import {
  LimaArchSchema,
  LimaMountTypeSchema,
  LimaVMTypeSchema,
} from '../shared/limactl-types.gen.ts';
import {
  isNullOrUndefined,
  machineInfoArchToLimaArch,
  templateLocator,
  templateNameFromBase,
  withValidatedField,
} from '../shared/util.ts';
import { useNewVMStore } from '../stores/new-vm-store.ts';

/* New VM: the create form with a live lima.yaml preview aside. */
export function NewVmPage() {
  /** queries */
  const { data: machineInfo } = useQueryMachineInfo();
  const { data: templates, isPending: templatesPending } =
    useQueryPublicTemplates();

  /** store */
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
  const [ssh, setSSH] = useNewVMStore('config.ssh');
  const [user, setUser] = useNewVMStore('config.user');

  /** memos */
  const currentMachineArch = machineInfoArchToLimaArch(machineInfo?.arch);
  const selectedTemplate = templateNameFromBase(base);

  const sshDraft: LimaSSH = ssh ?? {};
  const userDraft: LimaUser = user ?? {};

  /** vz is macOS-only (Apple Virtualization), but qemu works everywhere */
  const vmTypes = useMemo<Array<{ desc: string; value: LimaVMType }>>(() => {
    if (machineInfo?.platform !== 'darwin') {
      return [{ desc: 'QEMU', value: 'qemu' }];
    }
    return [
      { desc: 'Apple Virtualization', value: 'vz' },
      { desc: 'QEMU', value: 'qemu' },
    ];
  }, [machineInfo?.platform]);

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
    switch (machineInfo?.platform) {
      case 'darwin':
        setMountType('virtiofs');
        break;
      case 'win32':
        setMountType('wsl2');
        break;
      default:
        setMountType('9p');
        break;
    }
  }, [machineInfo?.platform, setMountType, setCpus, setRam]);

  return (
    <PageLayout
      subheader={{
        breadcrumbs: [
          { title: 'Instances', url: uiRoutes.instances() },
          { title: 'New', url: uiRoutes.newVm() },
        ],
        title: 'New VM',
      }}
    >
      <form className="flex min-w-0 flex-[999_1_620px] flex-col gap-6">
        <CrtSection
          contentClassName="flex flex-col gap-5 p-5"
          title="[1] IMAGE"
        >
          <LabeledField
            className="max-w-105"
            htmlFor="vm-name"
            label="INSTANCE NAME"
          >
            <Input
              autoComplete="off"
              id="vm-name"
              onChange={e => setName(e.target.value)}
              placeholder="eg. dev-box, ubuntu-24"
              spellCheck={false}
              value={name || ''}
            />
          </LabeledField>
          <TemplatePicker
            isPending={templatesPending}
            machineInfo={machineInfo}
            onSelect={templateName =>
              setBase([{ url: templateLocator(templateName) }])
            }
            selected={selectedTemplate}
            templates={templates}
          />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-x-5 gap-y-5">
            <CrtFieldset legend="ARCH">
              <RadioGroup
                className="flex flex-col gap-2"
                onValueChange={val => {
                  const validated = LimaArchSchema.safeParse(val);
                  if (validated.success) {
                    setArch(val);
                  }
                }}
                value={arch ?? ''}
              >
                {LimaArchSchema.options.map(archOpt => (
                  <CrtOption key={archOpt} sel={archOpt === arch}>
                    <RadioGroupItem value={archOpt} />
                    <span>{archOpt}</span>
                    <span className="ml-auto text-phosphor-dim">
                      {currentMachineArch === archOpt ? 'native' : 'emulated'}
                    </span>
                  </CrtOption>
                ))}
              </RadioGroup>
            </CrtFieldset>
            <CrtFieldset legend="VM TYPE">
              <RadioGroup
                className="flex flex-col gap-2"
                onValueChange={val => {
                  const validated = LimaVMTypeSchema.safeParse(val);
                  if (validated.success) {
                    setVmType(val);
                  }
                }}
                value={vmType ?? ''}
              >
                {vmTypes.map(vmTypeOpt => (
                  <CrtOption
                    key={vmTypeOpt.value}
                    off={vmTypeOpt.value === 'vz' && vzOff}
                    sel={vmTypeOpt.value === vmType}
                  >
                    <RadioGroupItem
                      disabled={vmTypeOpt.value === 'vz' && vzOff}
                      value={vmTypeOpt.value}
                    />
                    <span>{vmTypeOpt.value}</span>
                    <span className="ml-auto text-phosphor-dim">
                      {vmTypeOpt.desc}
                    </span>
                  </CrtOption>
                ))}
              </RadioGroup>
            </CrtFieldset>
          </div>
        </CrtSection>

        <CrtSection
          contentClassName="flex flex-col gap-4 p-5"
          title="[2] RESOURCES"
        >
          <div className="overflow-x-auto">
            <div className="grid min-w-135 grid-cols-[80px_auto_minmax(160px,1fr)] items-center gap-3">
              <ResourceMeter
                decLabel="Fewer CPUs"
                incLabel="More CPUs"
                label="CPUS"
                on={cpus ?? 0}
                onChange={setCpus}
                outputClassName="text-xl"
                total={machineInfo?.cpus ?? 1}
              >
                {cpus ?? 1}{' '}
                <span className="text-phosphor-dim">
                  vCPU / {machineInfo?.cpus}
                </span>
              </ResourceMeter>
              <ResourceMeter
                decLabel="Less memory"
                incLabel="More memory"
                label="MEMORY"
                on={Number(ram ?? 1)}
                onChange={newVal => setRam(String(newVal))}
                outputClassName="text-xl"
                total={machineInfo?.ram ?? 1}
              >
                {ram ?? 1}{' '}
                <span className="text-phosphor-dim">
                  GiB / {machineInfo?.ram}
                </span>
              </ResourceMeter>
              <ResourceMeter
                decLabel="Smaller disk"
                incLabel="Bigger disk"
                label="DISK"
                on={Number(disk ?? 100)}
                onChange={newVal => setDisk(String(newVal))}
                outputClassName="text-xl"
                step={10}
                total={machineInfo?.diskSpace ?? 100}
              >
                {disk} <span className="text-phosphor-dim">GiB</span>
              </ResourceMeter>
            </div>
          </div>
        </CrtSection>

        <CrtSection
          contentClassName="flex flex-col gap-4 p-5"
          title="[3] MOUNTS"
        >
          <CrtFieldset legend="MOUNT TYPE">
            <RadioGroup
              onValueChange={newMountType => {
                const validated = LimaMountTypeSchema.safeParse(newMountType);
                if (validated.success) {
                  setMountType(validated.data);
                }
              }}
              value={mountType}
            >
              <CrtOption sel>
                {LimaMountTypeSchema.options.map(mountType => (
                  <Fragment key={mountType}>
                    <RadioGroupItem
                      className="not-first:ml-4"
                      id={mountType}
                      value={mountType}
                    />
                    <label className="hover:cursor-pointer" htmlFor={mountType}>
                      {mountType}
                    </label>
                  </Fragment>
                ))}
              </CrtOption>
            </RadioGroup>
          </CrtFieldset>
          <MountsTable
            mounts={mounts ?? []}
            onAddMount={() =>
              setMounts(prev => [...(prev ?? []), { location: '' }])
            }
            onChangeMount={(index, updated) =>
              setMounts(prev =>
                prev?.map((m, i) => (index === i ? updated : m)),
              )
            }
            onRemoveMount={index =>
              setMounts(prev => prev?.filter((_, i) => index !== i))
            }
          />
        </CrtSection>

        <CrtSection
          contentClassName="flex flex-col gap-4 p-5"
          title="[4] PORT OVERRIDES"
        >
          <PortsTable
            onAddPortForward={() =>
              setPortForwards(prev => [...(prev ?? []), {}])
            }
            onChangePortForward={(index, updated) =>
              setPortForwards(prev =>
                prev?.map((pf, i) => (index === i ? updated : pf)),
              )
            }
            onRemovePortForward={index =>
              setPortForwards(prev => prev?.filter((_, i) => index !== i))
            }
            portForwards={portForwards ?? []}
          />
          <p className="flex items-center uppercase text-phosphor-dim">
            LIMA ALREADY FORWARDS GUEST PORTS TO 127.0.0.1 (THESE RULES will
            OVERRIDE THAT behaviour)
          </p>
        </CrtSection>

        <CrtSection contentClassName="flex flex-col gap-4 p-5" title="[5] SSH">
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <CheckboxRow
              checked={ssh?.forwardAgent}
              className="gap-2.5"
              label="FORWARD SSH AGENT"
              onCheckedChange={forwardAgent =>
                setSSH({ ...sshDraft, forwardAgent })
              }
            />
            <CheckboxRow
              checked={ssh?.loadDotSSHPubKeys}
              className="gap-2.5"
              label="LOAD ~/.ssh PUBKEYS"
              onCheckedChange={loadDotSSHPubKeys =>
                setSSH({ ...sshDraft, loadDotSSHPubKeys })
              }
            />
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-x-5 gap-y-5">
            <LabeledField htmlFor="ssh-port" label="SSH PORT">
              <Input
                autoComplete="off"
                id="ssh-port"
                onChange={e =>
                  setSSH(
                    withValidatedField(
                      sshDraft,
                      'localPort',
                      e.currentTarget.value,
                      PortNumberSchema,
                    ),
                  )
                }
                placeholder="auto"
                spellCheck={false}
                value={ssh?.localPort?.toString() ?? ''}
              />
            </LabeledField>
            <LabeledField htmlFor="guest-user" label="GUEST USER">
              <Input
                autoComplete="off"
                id="guest-user"
                onChange={e =>
                  setUser(
                    withValidatedField(
                      userDraft,
                      'name',
                      e.currentTarget.value,
                      UserNameSchema,
                    ),
                  )
                }
                placeholder="same as host"
                spellCheck={false}
                value={user?.name ?? ''}
              />
            </LabeledField>
          </div>
          <p className="flex items-center text-phosphor-dim">
            USER {user?.name || 'HOST'} · PORT {ssh?.localPort || 'AUTO'} · KEY
            ~/.lima/_config/user
          </p>
        </CrtSection>
      </form>
    </PageLayout>
  );
}
