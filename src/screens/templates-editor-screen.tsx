import { Link } from 'wouter';
import { AppFooter } from '@/components/app-footers.tsx';
import {
  CrtCursor,
  CrtFieldset,
  CrtKey,
  CrtOption,
  CrtSection,
} from '@/components/crt.tsx';
import { Button, buttonVariants } from '@/components/ui/button.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { Input } from '@/components/ui/input.tsx';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { cn } from '@/lib/utils.ts';
import { uiRoutes } from '@/routes/ui.ts';

const BASE_ROWS = [
  { first: true, loc: 'template:_images/ubuntu', n: 1 },
  { first: false, loc: 'template:_default/mounts', n: 2 },
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

const PROVISION_STEPS = [
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
    open: false,
    summary: '[ -d ~/.dotfiles ] || git clone "$PARAM_dotfiles" ~/.dotfiles',
  },
  {
    caret: '>',
    mode: 'data',
    n: 3,
    open: false,
    summary: '-> /etc/profile.d/go.sh',
  },
] as const;

const SYSTEM_SCRIPT = `#!/bin/bash
set -eux -o pipefail
command -v /usr/local/go/bin/go && exit 0
arch=$(dpkg --print-architecture)
curl -fsSL "https://go.dev/dl/go\${PARAM_goVersion}.linux-\${arch}.tar.gz" \\
  | tar -C /usr/local -xz`;

const PROBE_SCRIPT = `#!/bin/bash
test -x /usr/local/go/bin/go`;

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

/* Templates / Editor: form editor for one template, with validate aside. */
export function TemplatesEditorScreen() {
  return (
    <>
      <main className="mx-auto flex w-full max-w-360 flex-1 flex-col gap-5 p-6">
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
          <div aria-label="Editor mode" className="flex gap-1.5" role="group">
            <Button aria-pressed="true" type="button" variant="default">
              Form
            </Button>
            <Button aria-pressed="false" type="button" variant="outline">
              YAML
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-start gap-6">
          <div className="flex min-w-0 flex-[999_1_640px] flex-col gap-6">
            <CrtSection
              contentClassName="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-x-5 gap-y-4 p-5"
              title="[1] IDENTITY"
            >
              <div className="flex flex-col gap-1.5">
                <label
                  className="tracking-[0.08em] text-phosphor-dim"
                  htmlFor="t-name"
                >
                  NAME
                </label>
                <Input
                  autoComplete="off"
                  defaultValue="devbox"
                  id="t-name"
                  spellCheck={false}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  className="tracking-[0.08em] text-phosphor-dim"
                  htmlFor="t-desc"
                >
                  DESCRIPTION (HEADER COMMENT)
                </label>
                <Input
                  defaultValue="Go workstation with my dotfiles"
                  id="t-desc"
                />
              </div>
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
              <p className="text-phosphor-dim">
                This template overrides its bases. Lists such as mounts and
                provision are combined; maps such as env merge key by key.
              </p>
              {BASE_ROWS.map(row => (
                <div
                  className="grid grid-cols-[28px_minmax(0,1fr)_44px_44px_44px] items-center gap-2"
                  key={row.n}
                >
                  <span className="text-phosphor-dim">{row.n}.</span>
                  <code className="flex min-h-11 items-center overflow-x-auto border border-phosphor-line px-3 whitespace-nowrap">
                    {row.loc}
                  </code>
                  <Button
                    aria-label={`Move ${row.loc} up`}
                    className="w-11 px-0"
                    disabled={row.first}
                    type="button"
                    variant="outline"
                  >
                    ^
                  </Button>
                  <Button
                    aria-label={`Move ${row.loc} down`}
                    className="w-11 px-0"
                    disabled={row.n === BASE_ROWS.length}
                    type="button"
                    variant="outline"
                  >
                    v
                  </Button>
                  <Button
                    aria-label={`Remove ${row.loc}`}
                    className="w-11 px-0"
                    type="button"
                    variant="outline"
                  >
                    X
                  </Button>
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                <Input
                  aria-label="Base locator to add"
                  className="w-auto flex-[1_1_320px]"
                  placeholder="template:docker, github:..., ./base.yaml"
                  spellCheck={false}
                />
                <Button type="button" variant="outline">
                  + Add base
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-phosphor-dim">QUICK ADD</span>
                {QUICK_BASES.map(quick => (
                  <Button
                    className="border-phosphor-line normal-case"
                    disabled={quick.has}
                    key={quick.loc}
                    type="button"
                    variant="ghost"
                  >
                    {quick.loc}
                  </Button>
                ))}
              </div>
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
                  <span className="flex min-h-11 cursor-pointer items-center gap-2.5">
                    <Checkbox defaultChecked={row.on} />
                    <span>{row.on ? 'SET' : 'INHERIT'}</span>
                  </span>
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
              <div
                aria-hidden="true"
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_44px] gap-2 tracking-[0.08em] text-phosphor-dim"
              >
                <span>KEY</span>
                <span>DEFAULT VALUE</span>
                <span />
              </div>
              {PARAM_ROWS.map(param => (
                <div className="flex flex-col gap-1" key={param.k}>
                  <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_44px] items-center gap-2">
                    <Input
                      aria-label={`Parameter ${param.k} key`}
                      defaultValue={param.k}
                      spellCheck={false}
                    />
                    <Input
                      aria-label={`Parameter ${param.k} default`}
                      defaultValue={param.v}
                      spellCheck={false}
                    />
                    <Button
                      aria-label={`Remove parameter ${param.k}`}
                      className="w-11 px-0"
                      type="button"
                      variant="outline"
                    >
                      X
                    </Button>
                  </div>
                  <p className="wrap-anywhere text-phosphor-dim">
                    {param.usage}
                  </p>
                </div>
              ))}
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
                <div className="border border-phosphor-line" key={step.n}>
                  <div className="flex flex-wrap items-center gap-2 px-2 py-1.5">
                    <Button
                      aria-expanded={step.open}
                      className="normal-case"
                      type="button"
                      variant="ghost"
                    >
                      {step.caret} STEP {step.n}
                    </Button>
                    <CrtKey>{step.mode}</CrtKey>
                    <span className="min-w-0 flex-1 basis-50 wrap-anywhere text-phosphor-dim">
                      {step.summary}
                    </span>
                    <Button
                      aria-label={`Move step ${step.n} up`}
                      className="w-11 px-0"
                      disabled={step.n === 1}
                      type="button"
                      variant="outline"
                    >
                      ^
                    </Button>
                    <Button
                      aria-label={`Move step ${step.n} down`}
                      className="w-11 px-0"
                      disabled={step.n === PROVISION_STEPS.length}
                      type="button"
                      variant="outline"
                    >
                      v
                    </Button>
                    <Button
                      aria-label={`Remove step ${step.n}`}
                      className="w-11 px-0"
                      type="button"
                      variant="outline"
                    >
                      X
                    </Button>
                  </div>
                  {step.open && (
                    <div className="flex flex-col gap-3 border-t border-phosphor-line p-3">
                      <div
                        aria-label={`Step ${step.n} mode`}
                        className="flex flex-wrap gap-1.5"
                        role="group"
                      >
                        {SCRIPT_MODES.map(mode => (
                          <Button
                            aria-pressed={mode === step.mode}
                            className="normal-case"
                            key={mode}
                            type="button"
                            variant={mode === step.mode ? 'default' : 'outline'}
                          >
                            {mode}
                          </Button>
                        ))}
                      </div>
                      <p className="text-phosphor-dim">
                        Runs as root on every boot. Must be idempotent.
                      </p>
                      <div className="flex flex-col gap-2.5">
                        <RadioGroup
                          className="flex flex-wrap gap-2"
                          defaultValue={`inline-${step.n}`}
                        >
                          <CrtOption sel>
                            <RadioGroupItem value={`inline-${step.n}`} />
                            <span>INLINE SCRIPT</span>
                          </CrtOption>
                          <CrtOption>
                            <RadioGroupItem value={`file-${step.n}`} />
                            <span>FROM FILE</span>
                          </CrtOption>
                        </RadioGroup>
                        <Textarea
                          aria-label={`Step ${step.n} script`}
                          defaultValue={SYSTEM_SCRIPT}
                          rows={8}
                          spellCheck={false}
                        />
                      </div>
                    </div>
                  )}
                </div>
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
              <div className="flex flex-col gap-2 border border-phosphor-line p-3">
                <div className="grid grid-cols-[minmax(0,1fr)_44px] gap-2">
                  <Input
                    aria-label="Probe 1 description"
                    defaultValue="Go is installed"
                  />
                  <Button
                    aria-label="Remove probe 1"
                    className="w-11 px-0"
                    type="button"
                    variant="outline"
                  >
                    X
                  </Button>
                </div>
                <Textarea
                  aria-label="Probe 1 script"
                  defaultValue={PROBE_SCRIPT}
                  rows={3}
                  spellCheck={false}
                />
                <Input
                  aria-label="Probe 1 hint"
                  defaultValue="See serial*.log in the instance directory"
                  placeholder="Hint shown if the probe fails"
                />
              </div>
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
      </main>
      <AppFooter
        keys={[
          ['^S', 'SAVE'],
          ['^Y', 'FORM/YAML'],
          ['^R', 'NEW VM'],
          ['ESC', 'BACK'],
        ]}
        note="~/.lima/_templates/devbox.yaml"
      />
    </>
  );
}
