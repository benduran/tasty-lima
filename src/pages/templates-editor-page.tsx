import { Link } from 'wouter';
import { AppFooter } from '../components/app-footers.tsx';
import { CheckboxRow } from '../components/checkbox-row.tsx';
import {
  CrtCursor,
  CrtFieldset,
  CrtKey,
  CrtOption,
  CrtSection,
} from '../components/crt.tsx';
import { LabeledField } from '../components/labeled-field.tsx';
import { PressButtonGroup } from '../components/press-button-group.tsx';
import { BaseStackList } from '../components/templates-editor/base-stack-list.tsx';
import { ParameterRows } from '../components/templates-editor/parameter-rows.tsx';
import { ProbeEditor } from '../components/templates-editor/probe-editor.tsx';
import type { ProvisionStep } from '../components/templates-editor/provision-step-card.tsx';
import { ProvisionStepCard } from '../components/templates-editor/provision-step-card.tsx';
import { Button, buttonVariants } from '../components/ui/button.tsx';
import { Input } from '../components/ui/input.tsx';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group.tsx';
import { Textarea } from '../components/ui/textarea.tsx';
import { PageLayout } from '../layouts/PageLayout.tsx';
import { cn } from '../lib/utils.ts';
import { uiRoutes } from '../routes/ui.ts';

const BASE_ROWS = [
  'template:_images/ubuntu',
  'template:_default/mounts',
] as const;

const QUICK_BASES = [
  { has: true, loc: 'template:_images/ubuntu' },
  { has: false, loc: 'template:_images/debian' },
  { has: false, loc: 'template:_images/fedora' },
  { has: true, loc: 'template:_default/mounts' },
  { has: false, loc: 'template:docker' },
] as const;

const RESOURCE_ROWS = [
  { label: 'CPUS', on: true, unit: 'vCPU', v: '4' },
  { label: 'MEMORY', on: true, unit: 'GiB', v: '8' },
  { label: 'DISK', on: false, unit: 'GiB', v: '100' },
] as const;

const PARAM_ROWS = [
  {
    k: 'goVersion',
    usage:
      'YAML {{.Param.goVersion}} · SCRIPTS $PARAM_goVersion · CLI --param goVersion=...',
    v: '1.25.0',
  },
  {
    k: 'dotfiles',
    usage:
      'YAML {{.Param.dotfiles}} · SCRIPTS $PARAM_dotfiles · CLI --param dotfiles=...',
    v: 'https://github.com/ben/dotfiles',
  },
] as const;

const SCRIPT_MODES = [
  'system',
  'user',
  'boot',
  'dependency',
  'data',
  'yq',
] as const;

const PROVISION_STEPS: readonly ProvisionStep[] = [
  {
    caret: 'v',
    mode: 'system',
    n: 1,
    open: true,
    summary: 'set -eux -o pipefail',
  },
  {
    caret: '>',
    mode: 'user',
    n: 2,
    summary: '[ -d ~/.dotfiles ] || git clone "$PARAM_dotfiles" ~/.dotfiles',
  },
  {
    caret: '>',
    mode: 'data',
    n: 3,
    summary: '-> /etc/profile.d/go.sh',
  },
];

const PROBE = {
  description: 'Go is installed',
  hint: 'See serial*.log in the instance directory',
  script: `#!/bin/bash
test -x /usr/local/go/bin/go`,
} as const;

const SYSTEM_SCRIPT = `#!/bin/bash
set -eux -o pipefail
command -v /usr/local/go/bin/go && exit 0
arch=$(dpkg --print-architecture)
curl -fsSL "https://go.dev/dl/go\${PARAM_goVersion}.linux-\${arch}.tar.gz" \\
  | tar -C /usr/local -xz`;

const GENERATED_YAML = `# devbox: Go workstation with my dotfiles
minimumLimaVersion: 2.0.0
base:
- template:_images/ubuntu
- template:_default/mounts
cpus: 4
memory: 8GiB
param:
  goVersion: "1.25.0"
  dotfiles: "https://github.com/ben/dotfiles"
provision:
- mode: system
  script: |
    #!/bin/bash
    set -eux -o pipefail
    command -v /usr/local/go/bin/go && exit 0
    arch=$(dpkg --print-architecture)
    curl -fsSL "https://go.dev/dl/go\${PARAM_goVersion}.linux-\${arch}.tar.gz" \\
      | tar -C /usr/local -xz
- mode: user
  script: |
    #!/bin/bash
    [ -d ~/.dotfiles ] || git clone "$PARAM_dotfiles" ~/.dotfiles
- mode: data
  path: /etc/profile.d/go.sh
  content: |
    export PATH=$PATH:/usr/local/go/bin
probes:
- description: "Go is installed"
  script: |
    #!/bin/bash
    test -x /usr/local/go/bin/go
  hint: "See serial*.log in the instance directory"
message: |
  Run \`limactl shell {{.Name}}\` to get started.`;

export function TemplatesEditorPage() {
  return (
    <>
      <PageLayout>
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div className="flex min-w-0 flex-col gap-1.5">
            <p className="text-phosphor-dim">
              <Link href={uiRoutes.templates()}>TEMPLATES</Link> / devbox / EDIT
            </p>
            <h1 className="text-6xl wrap-anywhere">
              devbox
              <CrtCursor />
            </h1>
            <p className="text-phosphor-dim">
              ~/.lima/_templates/devbox.yaml · template:devbox · SAVED
            </p>
          </div>
          <PressButtonGroup
            aria-label="Editor mode"
            className="gap-1.5"
            items={[
              { id: 'form', label: 'Form', selected: true },
              { id: 'yaml', label: 'YAML' },
            ]}
          />
        </div>

        <div className="flex flex-wrap items-start gap-6">
          <div className="flex min-w-0 flex-[999_1_640px] flex-col gap-6">
            <CrtSection
              contentClassName="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-x-5 gap-y-4 p-5"
              title="[1] IDENTITY"
            >
              <LabeledField htmlFor="t-name" label="NAME">
                <Input
                  autoComplete="off"
                  defaultValue="devbox"
                  id="t-name"
                  spellCheck={false}
                />
              </LabeledField>
              <LabeledField
                htmlFor="t-desc"
                label="DESCRIPTION (HEADER COMMENT)"
              >
                <Input
                  defaultValue="Go workstation with my dotfiles"
                  id="t-desc"
                />
              </LabeledField>
              <CrtFieldset
                className="col-span-full"
                legend="MINIMUM LIMA VERSION"
              >
                <RadioGroup
                  className="flex flex-wrap gap-2"
                  defaultValue="2.0.0"
                >
                  <CrtOption>
                    <RadioGroupItem value="none" />
                    <span>NOT SET</span>
                  </CrtOption>
                  <CrtOption>
                    <RadioGroupItem value="1.1.0" />
                    <span>1.1.0</span>
                  </CrtOption>
                  <CrtOption sel>
                    <RadioGroupItem value="2.0.0" />
                    <span>2.0.0</span>
                  </CrtOption>
                </RadioGroup>
              </CrtFieldset>
            </CrtSection>

            <CrtSection
              contentClassName="flex flex-col gap-3 p-5"
              title="[2] BASE STACK"
            >
              <BaseStackList quickAdd={QUICK_BASES} rows={BASE_ROWS} />
            </CrtSection>

            <CrtSection
              contentClassName="flex flex-col gap-2.5 p-5"
              title="[3] RESOURCES"
            >
              {RESOURCE_ROWS.map(row => (
                <div
                  className="grid grid-cols-[110px_150px_140px_auto] items-center gap-3"
                  key={row.label}
                >
                  <span>{row.label}</span>
                  <CheckboxRow
                    className="gap-2.5"
                    defaultChecked={row.on}
                    label={row.on ? 'SET' : 'INHERIT'}
                  />
                  <Input
                    aria-label={row.label}
                    defaultValue={row.v}
                    disabled={!row.on}
                    min={1}
                    type="number"
                  />
                  <span className="text-phosphor-dim">{row.unit}</span>
                </div>
              ))}
              <p className="text-phosphor-dim">
                Unset values fall through to the base stack, then to Lima
                defaults.
              </p>
            </CrtSection>

            <CrtSection
              contentClassName="flex flex-col gap-2.5 p-5"
              title="[4] PARAMETERS"
            >
              <ParameterRows params={PARAM_ROWS} />
              <div>
                <Button type="button" variant="outline">
                  + Add parameter
                </Button>
              </div>
              <p className="text-phosphor-dim">
                Set at launch with --param key=value. The new-VM dialog builds a
                field for each one.
              </p>
            </CrtSection>

            <CrtSection
              contentClassName="flex flex-col gap-2.5 p-5"
              label="RUNS: boot, data, yq, system, user"
              title="[5] PROVISION"
            >
              {PROVISION_STEPS.map(step => (
                <ProvisionStepCard
                  isLast={step.n === PROVISION_STEPS.length}
                  key={step.n}
                  modes={SCRIPT_MODES}
                  script={SYSTEM_SCRIPT}
                  step={step}
                />
              ))}
              <div>
                <Button type="button" variant="outline">
                  + Add step
                </Button>
              </div>
            </CrtSection>

            <CrtSection
              contentClassName="flex flex-col gap-3 p-5"
              title="[6] READINESS PROBES"
            >
              <p className="text-phosphor-dim">
                limactl start waits until each probe exits 0. Scripts run as the
                user and must start with #!.
              </p>
              <ProbeEditor probe={PROBE} />
              <div>
                <Button type="button" variant="outline">
                  + Add probe
                </Button>
              </div>
            </CrtSection>

            <CrtSection
              contentClassName="flex flex-col gap-2 p-5"
              title="[7] MESSAGE"
            >
              <label className="text-phosphor-dim" htmlFor="t-msg">
                Shown after the VM starts. Go template:{' '}
                {'{{.Name}}, {{.HostOS}}, {{.HostArch}}'} and other instance
                fields
              </label>
              <Textarea
                defaultValue="Run `limactl shell {{.Name}}` to get started."
                id="t-msg"
                rows={3}
              />
            </CrtSection>
          </div>

          <aside className="flex min-w-0 flex-[1_1_420px] flex-col gap-6">
            <CrtSection
              contentClassName="flex flex-col gap-2 p-4"
              label="OK"
              title="VALIDATE"
            >
              <div role="status">
                <p>
                  <CrtKey>OK</CrtKey> Template is valid.
                </p>
              </div>
              <p className="text-phosphor-dim">
                $ limactl template validate ~/.lima/_templates/devbox.yaml
              </p>
            </CrtSection>

            <CrtSection label="36 LINES" title="devbox.yaml">
              <pre className="max-h-225 overflow-auto px-4 py-3.5 leading-tight whitespace-pre">
                {GENERATED_YAML}
              </pre>
            </CrtSection>

            <div className="flex flex-col gap-2">
              <Button
                className="min-h-13 text-[24px]"
                type="button"
                variant="default"
              >
                Save
              </Button>
              <div className="flex flex-wrap gap-2">
                <Link
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'flex-1',
                  )}
                  href={uiRoutes.templateLaunch('TODO')}
                >
                  Save + new VM
                </Link>
                <Link
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'flex-1',
                  )}
                  href={uiRoutes.templateShare('TODO')}
                >
                  Share
                </Link>
                <Button disabled type="button" variant="ghost">
                  Revert
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </PageLayout>
    </>
  );
}
