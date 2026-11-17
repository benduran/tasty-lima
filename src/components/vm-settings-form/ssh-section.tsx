import type { LimaSSH, LimaUser, Nullish } from '../../shared/types.ts';
import { CheckboxRow } from '../checkbox-row.tsx';
import { CrtSection } from '../crt.tsx';
import { LabeledField } from '../labeled-field.tsx';
import { Input } from '../ui/input.tsx';

type SshSectionProps = {
  onForwardAgentChange: (forwardAgent: boolean) => void;
  onLoadDotSSHPubKeysChange: (loadDotSSHPubKeys: boolean) => void;
  onSSHLocalPortChange: (rawValue: string) => void;
  onUserNameChange: (rawValue: string) => void;
  ssh: Nullish<LimaSSH>;
  user: Nullish<LimaUser>;
};

export function SshSection({
  onForwardAgentChange,
  onLoadDotSSHPubKeysChange,
  onSSHLocalPortChange,
  onUserNameChange,
  ssh,
  user,
}: SshSectionProps) {
  return (
    <CrtSection contentClassName="flex flex-col gap-4 p-5" title="[6] SSH">
      <div className="flex flex-wrap gap-x-8 gap-y-3">
        <CheckboxRow
          checked={ssh?.forwardAgent}
          className="gap-2.5"
          label="FORWARD SSH AGENT"
          onCheckedChange={onForwardAgentChange}
        />
        <CheckboxRow
          checked={ssh?.loadDotSSHPubKeys}
          className="gap-2.5"
          label="LOAD ~/.ssh PUBKEYS"
          onCheckedChange={onLoadDotSSHPubKeysChange}
        />
      </div>
      <p className="text-phosphor-dim text-xs tracking-tight uppercase">
        forwarding the ssh agent exposes your host machine's ssh keys to
        everything running in this vm while connected. recommend using a vm-only
        key.
      </p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-x-5 gap-y-5">
        <LabeledField htmlFor="ssh-port" label="SSH PORT">
          <Input
            autoComplete="off"
            id="ssh-port"
            onChange={e => onSSHLocalPortChange(e.currentTarget.value)}
            placeholder="auto"
            spellCheck={false}
            value={ssh?.localPort?.toString() ?? ''}
          />
        </LabeledField>
        <LabeledField htmlFor="guest-user" label="GUEST USER">
          <Input
            autoComplete="off"
            id="guest-user"
            onChange={e => onUserNameChange(e.currentTarget.value)}
            placeholder="same as host"
            spellCheck={false}
            value={user?.name ?? ''}
          />
        </LabeledField>
      </div>
    </CrtSection>
  );
}
