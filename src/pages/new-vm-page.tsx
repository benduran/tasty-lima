import { Fragment, useEffect, useMemo } from 'react';
import { CheckboxRow } from '../components/checkbox-row.tsx';
import { CrtFieldset, CrtOption, CrtSection } from '../components/crt.tsx';
import { LabeledField } from '../components/labeled-field.tsx';
import { MountsTable } from '../components/mounts-table.tsx';
import { ResourceMeter } from '../components/resource-meter.tsx';
import { Input } from '../components/ui/input.tsx';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group.tsx';
import { useQueryMachineInfo } from '../hooks/use-query-machine-info.ts';
import { PageLayout } from '../layouts/PageLayout.tsx';
import { uiRoutes } from '../routes/ui.ts';
import type { LimaVMType } from '../shared/limactl-types.gen.ts';
import {
  LimaArchSchema,
  LimaMountTypeSchema,
  LimaVMTypeSchema,
} from '../shared/limactl-types.gen.ts';
import {
  isNullOrUndefined,
  machineInfoArchToLimaArch,
} from '../shared/util.ts';
import { useNewVMStore } from '../stores/new-vm-store.ts';

/* New VM: the create form with a live lima.yaml preview aside. */
export function NewVmPage() {
  /** queries */
  const { data: machineInfo } = useQueryMachineInfo();

  /** store */
  const [name, setName] = useNewVMStore('name');
  const [arch, setArch] = useNewVMStore('config.arch');
  const [vmType, setVmType] = useNewVMStore('config.vmType');
  const [mounts, setMounts] = useNewVMStore('config.mounts');
  const [cpus, setCpus] = useNewVMStore('config.cpus');
  const [ram, setRam] = useNewVMStore('config.memory');
  const [mountType, setMountType] = useNewVMStore('config.mountType');
  const [disk, setDisk] = useNewVMStore('config.disk');

  /** memos */
  const currentMachineArch = machineInfoArchToLimaArch(machineInfo?.arch);

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
    setMountType('virtiofs');
  }, [setMountType, setCpus, setRam]);

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
          {/* <CrtFieldset legend="TEMPLATE">
            <RadioGroup
              className="grid grid-cols-[repeat(auto-fit,minmax(min(190px,100%),1fr))] gap-2"
              defaultValue="ubuntu-lts"
            >
              {TEMPLATES.map(tpl => (
                <CrtOption
                  className="items-start py-2.5"
                  key={tpl.id}
                  sel={tpl.id === 'ubuntu-lts'}
                >
                  <RadioGroupItem value={tpl.id} />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[22px]">{tpl.id}</span>
                    <span className="text-phosphor-dim">{tpl.desc}</span>
                  </span>
                </CrtOption>
              ))}
            </RadioGroup>
          </CrtFieldset> */}
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
          contentClassName="flex flex-wrap gap-x-8 gap-y-3 p-5"
          title="[4] SSH"
        >
          <CheckboxRow
            className="gap-2.5"
            defaultChecked
            label="FORWARD SSH AGENT"
          />
          <p className="flex items-center text-phosphor-dim">
            USER ben · PORT AUTO · KEY ~/.lima/_config/user
          </p>
        </CrtSection>
      </form>
    </PageLayout>
  );
}
