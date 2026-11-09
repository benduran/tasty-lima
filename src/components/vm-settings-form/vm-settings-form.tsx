import { PressButtonGroup } from '../press-button-group.tsx';
import { Button } from '../ui/button.tsx';
import { ImageSection } from './image-section.tsx';
import { MountsSection } from './mounts-section.tsx';
import { PortOverridesSection } from './port-overrides-section.tsx';
import { ProvisionScriptsSection } from './provision-scripts-section.tsx';
import { ResourcesSection } from './resources-section.tsx';
import { SshSection } from './ssh-section.tsx';
import { useVmSettings } from './use-vm-settings.tsx';
import {
  RawYamlSection,
  YamlNameSection,
  YamlValidationSection,
} from './yaml-sections.tsx';

export function VMSettingsForm() {
  /** hooks */
  const {
    arch,
    canCreate,
    configMode,
    cpus,
    currentMachineArch,
    disk,
    machineInfo,
    mountType,
    mounts,
    name,
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
    vmTypes,
    yamlError,
    vzOff,
  } = useVmSettings();

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
              onCpusChange={onCpusChange}
              onDiskMeterChange={onDiskMeterChange}
              onRamMeterChange={onRamMeterChange}
              ram={ram}
            />
            <MountsSection
              mounts={mounts}
              mountType={mountType}
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
            <YamlNameSection name={name} onNameChange={setName} />
            <YamlValidationSection error={yamlError} />
            <RawYamlSection
              onRawYamlChange={onRawYamlChange}
              rawYaml={rawYaml}
            />
          </>
        )}
      </div>

      <div className="flex items-center justify-end gap-4 shrink-0">
        <Button onClick={onCancel} type="button" variant="outline">
          Cancel
        </Button>
        <Button disabled={!canCreate} type="submit">
          Create
        </Button>
        <Button disabled={!canCreate} onClick={onCreateAndBoot} type="button">
          Create and boot now
        </Button>
      </div>
    </form>
  );
}
