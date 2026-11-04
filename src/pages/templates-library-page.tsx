import { Link } from 'wouter';
import type { PressItem } from '../components/press-button-group.tsx';
import { PressButtonGroup } from '../components/press-button-group.tsx';
import { PromptSearch } from '../components/prompt-search.tsx';
import { LinkRemoteForm } from '../components/templates-library/link-remote-form.tsx';
import { TemplateDetailPanel } from '../components/templates-library/template-detail-panel.tsx';
import type { LibraryGroup } from '../components/templates-library/template-list.tsx';
import { TemplateList } from '../components/templates-library/template-list.tsx';
import { buttonVariants } from '../components/ui/button.tsx';
import { PageLayout } from '../layouts/PageLayout.tsx';
import { cn } from '../lib/utils.ts';
import { uiRoutes } from '../routes/ui.ts';

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

const LIBRARY_GROUPS: readonly LibraryGroup[] = [
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

const SOURCE_FILTERS: readonly PressItem[] = [
  { count: 19, id: 'all', label: 'All', selected: true },
  { count: 3, id: 'mine', label: 'Mine' },
  { count: 2, id: 'linked', label: 'Linked' },
  { count: 14, id: 'builtin', label: 'Built-in' },
];

const BASE_STACK = [
  'template:_images/ubuntu',
  'template:_default/mounts',
  '~/.lima/_templates/devbox.yaml',
];

const PARAMETERS = [
  { k: 'goVersion', v: '1.25.0' },
  { k: 'dotfiles', v: 'https://github.com/ben/dotfiles' },
] as const;

const DEFINES = [
  '4 CPU · 8 GiB · disk inherited',
  '3 PROVISION STEPS',
  '1 READINESS PROBE',
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

export function TemplatesLibraryPage() {
  return (
    <>
      <PageLayout
        subheader={{
          actions: (
            <Link
              className={cn(
                buttonVariants({ size: 'lg', variant: 'default' }),
                'px-5.5',
              )}
              href={uiRoutes.templateEdit('TODO')}
            >
              + New template
            </Link>
          ),
          subtitle: '3 MINE · 2 LINKED · 14 BUILT-IN · ~/.lima/_templates',
          title: 'Templates',
        }}
      >
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <PromptSearch
            htmlFor="tq"
            placeholder="name, base, distro..."
            prompt="FILTER>"
          />
          <PressButtonGroup aria-label="Source" items={SOURCE_FILTERS} />
        </div>

        <LinkRemoteForm
          defaultValue="github:acme-platform/dev-env"
          hint="RESOLVES TO https://raw.githubusercontent.com/acme-platform/dev-env/<default branch>/.lima.yaml (unpinned: add @tag to lock it)"
          placeholder="github:owner/repo/path@ref  or  https://..."
        />

        <div className="flex flex-wrap items-start gap-6">
          <TemplateList className="flex-[1_1_440px]" groups={LIBRARY_GROUPS} />
          <TemplateDetailPanel
            baseStack={BASE_STACK}
            className="flex-[999_1_620px]"
            defines={DEFINES}
            description="Go workstation with my dotfiles"
            locator="template:devbox"
            name="devbox"
            parameters={PARAMETERS}
            source="MINE"
            yaml={DEVBOX_YAML}
          />
        </div>
      </PageLayout>
    </>
  );
}
