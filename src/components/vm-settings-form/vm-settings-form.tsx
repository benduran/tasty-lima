import { PressButtonGroup } from '../press-button-group.tsx';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert.tsx';
import { Button } from '../ui/button.tsx';
import { ImageSection } from './image-section.tsx';
import { MountsSection } from './mounts-section.tsx';
import { PortOverridesSection } from './port-overrides-section.tsx';
import { ProvisionScriptsSection } from './provision-scripts-section.tsx';
import { ResourcesSection } from './resources-section.tsx';
import { SshSection } from './ssh-section.tsx';
import type { UseVmSettingsOpts } from './use-vm-settings.tsx';
import { useVmSettings } from './use-vm-settings.tsx';
import {
  RawYamlSection,
  YamlNameSection,
  YamlValidationSection,
} from './yaml-sections.tsx';

type VMSettingsFormProps = UseVmSettingsOpts;

export function VMSettingsForm({ vmToEdit }: VMSettingsFormProps) {
  /** hooks */
  const {
    arch,
    canCreate,
    configMode,
    cpus,
    currentMachineArch,
    disk,
    editing,
    machineInfo,
    mountType,
    mountTypes,
    mounts,
    name,
    nestedVirtualization,
    onAddMount,
    onAddPortForward,
    onAddScript,
    onArchChange,
    onCancel,
    onChangeMount,
    onChangePortForward,
    onChangeScript,
    onCpusChange,
    onCreateAndBoot,
    onDiskMeterChange,
    onFormSubmit,
    onForwardAgentChange,
    onLoadDotSSHPubKeysChange,
    onMountTypeChange,
    onNameChange: setName,
    onNestedVirtualizationChange,
    onRawYamlChange,
    onRamMeterChange,
    onRemoveMount,
    onRemovePortForward,
    onRemoveScript,
    onSSHLocalPortChange,
    onTemplateSelect,
    onUserNameChange,
    onVmTypeChange,
    portForwards,
    provision,
    ram,
    rawYaml,
    selectedTemplate,
    ssh,
    switchMode,
    templates,
    templatesPending,
    user,
    vmType,
    vmToEditMissing,
    vmToEditRunning,
    vmTypes,
    yamlError,
    vzOff,
  } = useVmSettings({ vmToEdit });

  if (vmToEditMissing) {
    return (
      <Alert variant="default">
        <AlertTitle>VM missing</AlertTitle>
        <AlertDescription>
          No instance named "{vmToEdit}" exists.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form
      className="flex min-w-0 flex-col grow gap-6 min-h-0 overflow-y-auto"
      onSubmit={onFormSubmit}
    >
      <div className="flex justify-end shrink-0">
        <PressButtonGroup
          aria-label="Editor mode"
          items={[
            { id: 'form', label: 'Form' },
            { id: 'yaml', label: 'YAML' },
          ]}
          onChange={switchMode}
          value={configMode === 'yaml' ? 'yaml' : 'form'}
        />
      </div>

      <div className="grow min-h-0 overflow-y-auto">
        {configMode === 'form' ? (
          <>
            <ImageSection
              arch={arch}
              currentMachineArch={currentMachineArch}
              editing={editing}
              machineInfo={machineInfo}
              name={name}
              onArchChange={onArchChange}
              onNameChange={setName}
              onTemplateSelect={onTemplateSelect}
              onVmTypeChange={onVmTypeChange}
              selectedTemplate={selectedTemplate}
              templates={templates}
              templatesPending={templatesPending}
              vmType={vmType}
              vmTypes={vmTypes}
              vzOff={vzOff}
            />
            <ResourcesSection
              cpus={cpus}
              disk={disk}
              machineInfo={machineInfo}
              nestedVirtualization={nestedVirtualization}
              onCpusChange={onCpusChange}
              onDiskMeterChange={onDiskMeterChange}
              onNestedVirtualizationChange={onNestedVirtualizationChange}
              onRamMeterChange={onRamMeterChange}
              ram={ram}
            />
            <MountsSection
              mounts={mounts}
              mountType={mountType}
              mountTypes={mountTypes}
              onAddMount={onAddMount}
              onChangeMount={onChangeMount}
              onMountTypeChange={onMountTypeChange}
              onRemoveMount={onRemoveMount}
            />
            <PortOverridesSection
              onAddPortForward={onAddPortForward}
              onChangePortForward={onChangePortForward}
              onRemovePortForward={onRemovePortForward}
              portForwards={portForwards}
            />
            <SshSection
              onForwardAgentChange={onForwardAgentChange}
              onLoadDotSSHPubKeysChange={onLoadDotSSHPubKeysChange}
              onSSHLocalPortChange={onSSHLocalPortChange}
              onUserNameChange={onUserNameChange}
              ssh={ssh}
              user={user}
            />
            <ProvisionScriptsSection
              onAddScript={onAddScript}
              onChangeScript={onChangeScript}
              onRemoveScript={onRemoveScript}
              provision={provision}
            />
          </>
        ) : (
          <>
            {!editing && <YamlNameSection name={name} onNameChange={setName} />}
            <YamlValidationSection error={yamlError} />
            <RawYamlSection
              onRawYamlChange={onRawYamlChange}
              rawYaml={rawYaml}
            />
          </>
        )}
      </div>

      <div className="flex items-center justify-end gap-4 shrink-0">
        {vmToEditRunning && (
          <p className="mr-auto text-phosphor-dim">
            {name} is currently running. It will be automatically shut down when
            you save any changes.
          </p>
        )}
        <Button onClick={onCancel} type="button" variant="outline">
          Cancel
        </Button>
        <Button disabled={!canCreate} type="submit">
          {editing ? 'Save' : 'Create'}
        </Button>
        <Button disabled={!canCreate} onClick={onCreateAndBoot} type="button">
          {editing ? 'Save and reboot' : 'Create and boot now'}
        </Button>
      </div>
    </form>
  );
}
