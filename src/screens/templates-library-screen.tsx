import { Link } from 'wouter';
import { AppFooter } from '@/components/app-footers';
import { CrtCursor, CrtKey } from '@/components/crt';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { uiRoutes } from '@/routes/ui';

const BUILTIN = [
  { name: 'default', sub: 'Ubuntu + containerd/nerdctl', tags: ['T1'] },
  { name: 'ubuntu-lts', sub: 'Ubuntu LTS', tags: [] },
  { name: 'debian', sub: 'Debian', tags: ['T1'] },
  { name: 'fedora', sub: 'Fedora', tags: ['T1'] },
  { name: 'opensuse', sub: 'openSUSE Leap', tags: ['T1'] },
  { name: 'alpine', sub: 'Alpine Linux', tags: ['T2'] },
  { name: 'archlinux', sub: 'Arch Linux', tags: ['T2'] },
  { name: 'rocky', sub: 'Rocky Linux', tags: [] },
  { name: 'docker', sub: 'Ubuntu + Docker (rootless)', tags: ['T1'] },
  { name: 'podman', sub: 'Podman (rootless)', tags: [] },
  { name: 'k3s', sub: 'k3s Kubernetes', tags: [] },
  { name: 'k8s', sub: 'kubeadm Kubernetes', tags: ['T1'] },
  { name: 'freebsd', sub: 'FreeBSD', tags: ['EXP'] },
  { name: 'macos', sub: 'macOS guest', tags: ['EXP'] },
] as const;

const LIBRARY_GROUPS = [
  {
    items: [
      {
        name: 'devbox',
        selected: true,
        sub: 'ubuntu · 2 params · edited 10-19',
        tags: ['SHARED'],
      },
      {
        name: 'clickhouse-lab',
        selected: false,
        sub: 'docker · 1 param · edited 10-02',
        tags: [],
      },
      {
        name: 'k3s-tiny',
        selected: false,
        sub: 'k3s · no params · edited 09-14',
        tags: [],
      },
    ],
    label: 'MINE',
    where: '~/.lima/_templates',
  },
  {
    items: [
      {
        name: 'dev-env',
        selected: false,
        sub: 'github · default branch · fetched 10-20',
        tags: ['UNPINNED'],
      },
      {
        name: 'fedora@v2.0.0',
        selected: false,
        sub: 'github · tag v2.0.0 · fetched 10-18',
        tags: ['PINNED'],
      },
    ],
    label: 'LINKED',
    where: 'remote',
  },
  {
    items: BUILTIN.map(tpl => ({ ...tpl, selected: false })),
    label: 'BUILT-IN',
    where: 'template:',
  },
];

const SOURCE_FILTERS = [
  { count: 19, id: 'all', label: 'All' },
  { count: 3, id: 'mine', label: 'Mine' },
  { count: 2, id: 'linked', label: 'Linked' },
  { count: 14, id: 'builtin', label: 'Built-in' },
] as const;

const BASE_STACK = [
  'template:_images/ubuntu',
  'template:_default/mounts',
  '~/.lima/_templates/devbox.yaml',
];

const PARAMETERS = [
  { k: 'goVersion', v: '1.25.0' },
  { k: 'dotfiles', v: 'https://github.com/ben/dotfiles' },
] as const;

const DEVBOX_YAML = `# devbox: Go workstation with my dotfiles
minimumLimaVersion: 2.0.0
base:
- template:_images/ubuntu
- template:_default/mounts
cpus: 4
memory: 8GiB
param:
  goVersion: "1.25.0"
  dotfiles: https://github.com/ben/dotfiles
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
- description: Go is installed
  script: |
    #!/bin/bash
    test -x /usr/local/go/bin/go
message: |
  Run \`limactl shell {{.Name}}\` to get started.`;

/* Templates / Library: the library list plus the selected template detail. */
export function TemplatesLibraryScreen() {
  return (
    <>
      <main className="mx-auto flex w-full max-w-360 flex-1 flex-col gap-5 p-6">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-6xl">
              TEMPLATES
              <CrtCursor />
            </h1>
            <p className="text-phosphor-dim">
              3 MINE · 2 LINKED · 14 BUILT-IN · ~/.lima/_templates
            </p>
          </div>
          <Link
            className={cn(
              buttonVariants({ size: 'lg', variant: 'default' }),
              'px-5.5',
            )}
            href={uiRoutes.templateEdit('TODO')}
          >
            + New template
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <label
            className="flex max-w-95 flex-1 basis-65 items-center gap-2.5"
            htmlFor="tq"
          >
            <span>FILTER&gt;</span>
            <Input id="tq" placeholder="name, base, distro..." type="search" />
          </label>
          <div
            aria-label="Source"
            className="flex flex-wrap gap-2"
            role="group"
          >
            {SOURCE_FILTERS.map(filter => (
              <Button
                aria-pressed={filter.id === 'all'}
                key={filter.id}
                type="button"
                variant={filter.id === 'all' ? 'default' : 'outline'}
              >
                {filter.label} {filter.count}
              </Button>
            ))}
          </div>
        </div>

        <section className="flex flex-col gap-2 border border-dashed border-phosphor-dim p-3.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <label className="flex-none" htmlFor="imp-url">
              LINK REMOTE&gt;
            </label>
            <Input
              autoComplete="off"
              className="w-auto flex-[1_1_360px]"
              defaultValue="github:acme-platform/dev-env"
              id="imp-url"
              placeholder="github:owner/repo/path@ref  or  https://..."
              spellCheck={false}
            />
            <Button type="button" variant="outline">
              Link
            </Button>
          </div>
          <p className="wrap-anywhere text-phosphor-dim">
            RESOLVES TO
            https://raw.githubusercontent.com/acme-platform/dev-env/&lt;default
            branch&gt;/.lima.yaml (unpinned: add @tag to lock it)
          </p>
        </section>

        <div className="flex flex-wrap items-start gap-6">
          <section className="min-w-0 flex-[1_1_440px] border border-phosphor-dim">
            <h2 className="flex justify-between gap-3 bg-primary px-3 py-0.5 text-[20px] tracking-[0.08em] text-primary-foreground text-shadow-none">
              <span>LIBRARY</span>
              <span>19 SHOWN</span>
            </h2>
            {LIBRARY_GROUPS.map(group => (
              <div key={group.label}>
                <p className="flex justify-between gap-3 border-b border-phosphor-line px-3 pt-2.5 pb-1 tracking-[0.08em] text-phosphor-dim">
                  <span>{group.label}</span>
                  <span>{group.where}</span>
                </p>
                {group.items.map(item => (
                  <button
                    aria-pressed={item.selected}
                    className={cn(
                      'grid w-full min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 border-b border-phosphor-line px-3 py-1.5 text-left whitespace-normal hover:bg-phosphor-faint',
                      item.selected &&
                        'bg-phosphor-faint text-shadow-(--glow) outline -outline-offset-1 outline-primary',
                    )}
                    key={item.name}
                    type="button"
                  >
                    <span className="text-[23px] wrap-anywhere">
                      {item.name}
                    </span>
                    {item.tags.length > 0 && (
                      <span className="flex gap-1.5">
                        {item.tags.map(tag => (
                          <span
                            className="border border-phosphor-dim px-1.25 whitespace-nowrap"
                            key={tag}
                          >
                            {tag}
                          </span>
                        ))}
                      </span>
                    )}
                    <span className="col-span-full text-phosphor-dim wrap-anywhere">
                      {item.sub}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </section>

          <section className="flex min-w-0 flex-[999_1_620px] flex-col border border-phosphor-dim">
            <h2 className="flex justify-between gap-3 bg-primary px-3 py-0.5 text-[20px] tracking-[0.08em] text-primary-foreground text-shadow-none">
              <span>TEMPLATE: devbox</span>
              <span>MINE</span>
            </h2>
            <div className="flex flex-1 flex-col gap-4.5 p-5">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                <span className="text-[44px] leading-none">devbox</span>
                <span className="text-phosphor-dim">
                  Go workstation with my dotfiles
                </span>
              </div>

              <div className="flex items-stretch gap-2">
                <code className="flex min-w-0 flex-1 items-center overflow-x-auto border border-dashed border-phosphor-dim px-3 text-[22px] whitespace-nowrap">
                  template:devbox
                </code>
                <Button
                  aria-label="Copy locator"
                  type="button"
                  variant="outline"
                >
                  Copy
                </Button>
              </div>

              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-x-8 gap-y-4">
                <div className="flex flex-col gap-1.5">
                  <h3 className="tracking-[0.08em] text-phosphor-dim">
                    BASE STACK
                  </h3>
                  {BASE_STACK.map((loc, i) => (
                    <p className="wrap-anywhere" key={loc}>
                      <span className="text-phosphor-dim">{i + 1}.</span> {loc}
                    </p>
                  ))}
                </div>
                <div className="flex flex-col gap-1.5">
                  <h3 className="tracking-[0.08em] text-phosphor-dim">
                    PARAMETERS
                  </h3>
                  {PARAMETERS.map(param => (
                    <p className="flex justify-between gap-3" key={param.k}>
                      <span>{param.k}</span>
                      <span className="text-right text-phosphor-dim wrap-anywhere">
                        {param.v}
                      </span>
                    </p>
                  ))}
                </div>
                <div className="flex flex-col gap-1.5">
                  <h3 className="tracking-[0.08em] text-phosphor-dim">
                    DEFINES
                  </h3>
                  <p>4 CPU · 8 GiB · disk inherited</p>
                  <p>3 PROVISION STEPS</p>
                  <p>1 READINESS PROBE</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border border-phosphor-line px-3 py-2">
                <CrtKey>VALID</CrtKey>
                <span className="wrap-anywhere">
                  Template parses and resolves.
                </span>
                <span className="ml-auto text-phosphor-dim">
                  limactl template validate
                </span>
              </div>

              <div className="flex flex-col border border-phosphor-line">
                <div className="flex flex-wrap items-center gap-2 border-b border-phosphor-line px-2 py-1.5">
                  <div
                    aria-label="YAML view"
                    className="flex gap-1.5"
                    role="group"
                  >
                    <Button aria-pressed="true" type="button" variant="default">
                      As written
                    </Button>
                    <Button
                      aria-pressed="false"
                      type="button"
                      variant="outline"
                    >
                      Resolved
                    </Button>
                  </div>
                  <span className="ml-auto text-phosphor-dim">as saved</span>
                </div>
                <pre className="h-90 overflow-auto px-3.5 py-3 leading-tight whitespace-pre">
                  {DEVBOX_YAML}
                </pre>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-phosphor-line px-5 py-3.5">
              <Link
                className={cn(
                  buttonVariants({ size: 'lg', variant: 'default' }),
                )}
                href={uiRoutes.templateLaunch('TODO')}
              >
                New VM from this
              </Link>
              <Link
                className={cn(buttonVariants({ variant: 'outline' }))}
                href={uiRoutes.templateEdit('TODO')}
              >
                Edit
              </Link>
              <Link
                className={cn(buttonVariants({ variant: 'outline' }))}
                href={uiRoutes.templateShare('TODO')}
              >
                Share
              </Link>
              <Button type="button" variant="outline">
                Duplicate
              </Button>
              <Button className="ml-auto" type="button" variant="outline">
                Delete
              </Button>
            </div>
          </section>
        </div>
      </main>
      <AppFooter
        keys={[
          ['ENTER', 'NEW VM'],
          ['E', 'EDIT'],
          ['S', 'SHARE'],
          ['D', 'DUPLICATE'],
          ['/', 'FILTER'],
        ]}
        note="~/.lima/_templates"
      />
    </>
  );
}
