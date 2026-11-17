import type { LimaProvision } from '../../shared/types.ts';
import { CrtSection } from '../crt.tsx';
import { ProvisionScriptsTable } from '../provision-scripts-table.tsx';

type ProvisionScriptsSectionProps = {
  onAddScript: (isBoot: boolean) => void;
  onChangeScript: (index: number, script: string) => void;
  onRemoveScript: (index: number) => void;
  provision: LimaProvision[];
};

export function ProvisionScriptsSection({
  onAddScript,
  onChangeScript,
  onRemoveScript,
  provision,
}: ProvisionScriptsSectionProps) {
  return (
    <CrtSection
      contentClassName="flex flex-col gap-4 p-5"
      title="[7] PROVISION SCRIPTS"
    >
      <ProvisionScriptsTable
        onAddScript={onAddScript}
        onChangeScript={onChangeScript}
        onRemoveScript={onRemoveScript}
        provision={provision}
      />
    </CrtSection>
  );
}
