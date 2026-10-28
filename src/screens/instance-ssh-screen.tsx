import { AppFooter } from '@/components/app-footers.tsx';
import { CrtFieldset, CrtOption, CrtSection } from '@/components/crt.tsx';
import { InstancePage } from '@/components/instance-page.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { Input } from '@/components/ui/input.tsx';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.tsx';

const CONNECT_CMDS = [
  {
    cmd: 'limactl shell default',
    label: 'LIMACTL',
    primary: true,
  },
  {
    cmd: 'ssh -F ~/.lima/default/ssh.config lima-default',
    label: 'SSH VIA LIMA CONFIG',
    primary: false,
  },
  {
    cmd: 'ssh -p 60022 -i ~/.lima/_config/user -o NoHostAuthenticationForLocalHost=yes ben@127.0.0.1',
    label: 'PLAIN SSH',
    primary: false,
  },
] as const;

const SSH_CONFIG = `# ~/.lima/default/ssh.config
Host lima-default
  IdentityFile "/Users/ben/.lima/_config/user"
  StrictHostKeyChecking no
  UserKnownHostsFile /dev/null
  NoHostAuthenticationForLocalHost yes
  PreferredAuthentications publickey
  BatchMode yes
  IdentitiesOnly yes
  User ben
  ControlMaster auto
  ControlPath "/Users/ben/.lima/default/ssh.sock"
  ControlPersist yes
  Hostname 127.0.0.1
  Port 60022`;

const LIMA_YAML = `user:
  name: ben
ssh:
  localPort: 0
  loadDotSSHPubKeys: false
  forwardAgent: false
  forwardX11: false`;

const SSH_CONFIG_INCLUDE = `# ~/.ssh/config
  Include ~/.lima/*/ssh.config   (not added)`;

/* Instance / SSH: connect commands, ssh settings and generated configs. */
export function InstanceSshScreen() {
  return (
    <>
      <main className="mx-auto flex w-full max-w-360 flex-1 flex-col gap-6 p-6">
        <InstancePage active="ssh" />

        <CrtSection
          contentClassName="flex flex-col gap-3.5 p-5"
          label="127.0.0.1:60022"
          title="CONNECT"
        >
          {CONNECT_CMDS.map(entry => (
            <div
              className="grid grid-cols-[minmax(150px,220px)_minmax(0,1fr)_auto] items-center gap-x-4"
              key={entry.label}
            >
              <span className="tracking-[0.08em] text-phosphor-dim">
                {entry.label}
              </span>
              <code className="flex min-h-11 items-center overflow-x-auto border border-dashed border-phosphor-dim px-3 text-[22px] whitespace-nowrap">
                $ {entry.cmd}
              </code>
              <Button
                aria-label={`Copy ${entry.label} command`}
                type="button"
                variant={entry.primary ? 'default' : 'outline'}
              >
                Copy
              </Button>
            </div>
          ))}
        </CrtSection>

        <div className="flex flex-wrap items-start gap-6">
          <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-6">
            <CrtSection
              contentClassName="flex flex-col gap-5 p-5"
              title="SSH SETTINGS"
            >
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-5">
                <div className="flex flex-col gap-1.5">
                  <label
                    className="tracking-[0.08em] text-phosphor-dim"
                    htmlFor="ssh-user"
                  >
                    GUEST USER
                  </label>
                  <Input
                    autoComplete="off"
                    defaultValue="ben"
                    id="ssh-user"
                    spellCheck={false}
                  />
                </div>
                <CrtFieldset legend="LOCAL PORT">
                  <RadioGroup
                    className="flex flex-wrap gap-2"
                    defaultValue="auto"
                  >
                    <CrtOption sel>
                      <RadioGroupItem value="auto" />
                      <span>AUTO</span>
                    </CrtOption>
                    <CrtOption>
                      <RadioGroupItem value="fixed" />
                      <span>FIXED</span>
                    </CrtOption>
                    <Input
                      aria-label="Fixed local port"
                      className="w-27.5"
                      defaultValue="60022"
                      disabled
                      type="number"
                    />
                  </RadioGroup>
                </CrtFieldset>
              </div>
              <CrtFieldset legend="OPTIONS">
                <div className="flex flex-col gap-1">
                  <span className="flex min-h-11 cursor-pointer items-center gap-3">
                    <Checkbox />
                    <span>FORWARD SSH AGENT</span>
                    <span className="text-phosphor-dim">ssh.forwardAgent</span>
                  </span>
                  <span className="flex min-h-11 cursor-pointer items-center gap-3">
                    <Checkbox />
                    <span>FORWARD X11</span>
                    <span className="text-phosphor-dim">ssh.forwardX11</span>
                  </span>
                  <span className="flex min-h-11 cursor-pointer items-center gap-3">
                    <Checkbox />
                    <span>COPY ~/.ssh/*.pub INTO GUEST</span>
                    <span className="text-phosphor-dim">
                      ssh.loadDotSSHPubKeys
                    </span>
                  </span>
                </div>
              </CrtFieldset>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="tracking-[0.08em] text-phosphor-dim">
                  IDENTITY
                </span>
                <code>~/.lima/_config/user</code>
                <span className="text-phosphor-dim">
                  ed25519, generated by Lima
                </span>
                <Button className="ml-auto" type="button" variant="ghost">
                  Copy public key
                </Button>
              </div>
            </CrtSection>

            <CrtSection
              contentClassName="flex flex-col gap-3.5 p-5"
              label="NOT LINKED"
              title="~/.ssh/config"
            >
              <span className="flex min-h-11 cursor-pointer items-center gap-3">
                <Checkbox />
                <span>LET PLAIN `ssh lima-default` WORK EVERYWHERE</span>
              </span>
              <p className="text-phosphor-dim">
                Adds one line to the top of ~/.ssh/config, so editors and other
                tools can reach every Lima VM by its alias.
              </p>
              <pre className="overflow-x-auto border border-dashed border-phosphor-dim px-3 py-2.5 whitespace-pre">
                {SSH_CONFIG_INCLUDE}
              </pre>
            </CrtSection>
          </div>

          <aside className="flex min-w-0 flex-[1_1_420px] flex-col border border-phosphor-dim">
            <h2 className="flex justify-between gap-3 bg-primary px-3 py-0.5 text-[20px] tracking-[0.08em] text-primary-foreground text-shadow-none">
              <span>ssh.config</span>
              <span>GENERATED</span>
            </h2>
            <pre className="overflow-x-auto p-4 leading-tight whitespace-pre">
              {SSH_CONFIG}
            </pre>
            <div className="flex items-center justify-between gap-3 border-t border-phosphor-line px-4 pt-2">
              <span className="tracking-[0.08em] text-phosphor-dim">
                lima.yaml
              </span>
            </div>
            <pre className="overflow-x-auto px-4 pt-2 pb-4 leading-tight whitespace-pre">
              {LIMA_YAML}
            </pre>
          </aside>
        </div>
      </main>
      <AppFooter
        keys={[
          ['C', 'COPY SHELL CMD'],
          ['F4', 'CONFIG'],
          ['F6', 'LOGS'],
        ]}
        note="~/.lima/default/ssh.config"
      />
    </>
  );
}
