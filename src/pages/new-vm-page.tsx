import { useEffect, useMemo } from 'react';
import {
  CrtCells,
  CrtFieldset,
  CrtOption,
  CrtSection,
} from '../components/crt.tsx';
import { Button } from '../components/ui/button.tsx';
import { Checkbox } from '../components/ui/checkbox.tsx';
import { Input } from '../components/ui/input.tsx';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group.tsx';
import { useQueryMachineInfo } from '../hooks/use-query-machine-info.ts';
import { PageLayout } from '../layouts/PageLayout.tsx';
import { uiRoutes } from '../routes/ui.ts';
import type { LimaArch, LimaVMType } from '../shared/limactl-types.gen.ts';
import {
  LimaArchSchema,
  LimaVMTypeSchema,
} from '../shared/limactl-types.gen.ts';
import type { Nullish } from '../shared/types.ts';
import { isNullOrUndefined } from '../shared/util.ts';
import { useNewVMStore } from '../stores/new-vm-store.ts';

/* New VM: the create form with a live lima.yaml preview aside. */
export function NewVmPage() {
  /** queries */
  const { data: machineInfo } = useQueryMachineInfo();

  /** store */
  const [name, setName] = useNewVMStore('name');
  const [arch, setArch] = useNewVMStore('config.arch');
  const [vmType, setVmType] = useNewVMStore('config.vmType');
  const [mounts] = useNewVMStore('config.mounts');

  /** memos */
  const currentMachineArch = useMemo<Nullish<LimaArch>>(() => {
    switch (machineInfo?.arch) {
      case 'arm64':
        return 'aarch64';
      case 'ppc64':
        return 'ppc64le';
      case 'riscv64':
        return 'riscv64';
      case 's390x':
        return 's390x';
      case 'x64':
        return 'x86_64';
      default:
        return null;
    }
  }, [machineInfo?.arch]);

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
          <div className="flex max-w-105 flex-col gap-1.5">
            <label
              className="tracking-[0.08em] text-phosphor-dim"
              htmlFor="vm-name"
            >
              INSTANCE NAME
            </label>
            <Input
              autoComplete="off"
              id="vm-name"
              onChange={e => setName(e.target.value)}
              placeholder="eg. dev-box, ubuntu-24"
              spellCheck={false}
              value={name || ''}
            />
          </div>
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
            <div className="grid min-w-135 grid-cols-[80px_44px_auto_44px_minmax(160px,1fr)] items-center gap-3">
              <span>CPUS</span>
              <Button
                aria-label="Fewer CPUs"
                className="w-11 px-0"
                type="button"
                variant="outline"
              >
                -
              </Button>
              <CrtCells on={4} total={10} />
              <Button
                aria-label="More CPUs"
                className="w-11 px-0"
                type="button"
                variant="outline"
              >
                +
              </Button>
              <output className="text-xl">
                4 <span className="text-phosphor-dim">vCPU / 10</span>
              </output>
              <span>MEMORY</span>
              <Button
                aria-label="Less memory"
                className="w-11 px-0"
                type="button"
                variant="outline"
              >
                -
              </Button>
              <CrtCells on={4} total={16} />
              <Button
                aria-label="More memory"
                className="w-11 px-0"
                type="button"
                variant="outline"
              >
                +
              </Button>
              <output className="text-xl">
                8 <span className="text-phosphor-dim">GiB / 32</span>
              </output>
              <span>DISK</span>
              <Button
                aria-label="Smaller disk"
                className="w-11 px-0"
                type="button"
                variant="outline"
              >
                -
              </Button>
              <CrtCells on={2} total={10} />
              <Button
                aria-label="Bigger disk"
                className="w-11 px-0"
                type="button"
                variant="outline"
              >
                +
              </Button>
              <output className="text-xl">
                100 <span className="text-phosphor-dim">GiB sparse</span>
              </output>
            </div>
          </div>
          <p className="text-phosphor-dim">
            RUNNING VMS USE 8 CPU / 12 GiB. WITH THIS ONE: 12 CPU / 20 GiB (CPU
            MAY OVERCOMMIT)
          </p>
        </CrtSection>

        <CrtSection
          contentClassName="flex flex-col gap-4 p-5"
          title="[3] MOUNTS"
        >
          <CrtFieldset legend="MOUNT TYPE">
            <RadioGroup
              className="flex flex-wrap gap-2"
              defaultValue="virtiofs"
            >
              <CrtOption sel>
                <RadioGroupItem value="virtiofs" />
                <span>virtiofs</span>
              </CrtOption>
              <CrtOption>
                <RadioGroupItem value="reverse-sshfs" />
                <span>reverse-sshfs</span>
              </CrtOption>
            </RadioGroup>
          </CrtFieldset>
          <div className="flex flex-col gap-2">
            <div
              aria-hidden="true"
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_76px_44px] gap-2 tracking-[0.08em] text-phosphor-dim"
            >
              <span>HOST PATH</span>
              <span>GUEST PATH</span>
              <span>ACCESS</span>
              <span />
            </div>
            {mounts?.map(mount => (
              <div
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_76px_44px] items-center gap-2"
                key={mount.location}
              >
                <Input
                  aria-label={`Host path ${mount.location}`}
                  defaultValue={mount.location}
                  spellCheck={false}
                />
                <Input
                  aria-label={`Guest path ${mount.mountPoint || ''}`}
                  defaultValue={mount.mountPoint}
                  placeholder="same as host"
                  spellCheck={false}
                />
                <span className="flex min-h-11 cursor-pointer items-center gap-2">
                  <Checkbox defaultChecked={mount.writable} />
                  <span>RW</span>
                </span>
                <Button
                  aria-label={`Remove mount ${mount.location}`}
                  className="w-11 px-0"
                  type="button"
                  variant="outline"
                >
                  X
                </Button>
              </div>
            ))}
            <div>
              <Button type="button" variant="outline">
                + Add mount
              </Button>
            </div>
          </div>
        </CrtSection>

        <CrtSection
          contentClassName="flex flex-wrap gap-x-8 gap-y-3 p-5"
          title="[4] SSH"
        >
          <span className="flex min-h-11 cursor-pointer items-center gap-2.5">
            <Checkbox defaultChecked />
            <span>FORWARD SSH AGENT</span>
          </span>
          <p className="flex items-center text-phosphor-dim">
            USER ben · PORT AUTO · KEY ~/.lima/_config/user
          </p>
        </CrtSection>
      </form>
    </PageLayout>
  );
}
