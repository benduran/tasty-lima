import { AppFooter } from '../components/app-footers.tsx';
import {
  CrtCells,
  CrtDot,
  CrtFieldset,
  CrtKey,
  CrtOption,
  CrtSection,
} from '../components/crt.tsx';
import { Button } from '../components/ui/button.tsx';
import { Input } from '../components/ui/input.tsx';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group.tsx';
import { PageLayout } from '../layouts/PageLayout.tsx';

const PRESETS = [
  { hex: '#6CC6FF', name: 'BLUE', note: 'default', selected: true },
  { hex: '#33FF66', name: 'GREEN', note: 'P1', selected: false },
  { hex: '#FFB000', name: 'AMBER', note: 'P3', selected: false },
  { hex: '#E8F1F2', name: 'WHITE', note: 'P4', selected: false },
] as const;

const SHADES = [
  { cls: 'bg-primary shadow-[var(--glow)]', label: 'TEXT' },
  { cls: 'bg-phosphor-dim', label: 'MUTED' },
  { cls: 'bg-phosphor-line', label: 'BORDER' },
  { cls: 'border border-phosphor-line bg-phosphor-faint', label: 'SURFACE' },
  { cls: 'border border-phosphor-line bg-background', label: 'SCREEN' },
] as const;

export function ThemePage() {
  return (
    <>
      <PageLayout
        subheader={{
          subtitle: 'ONE PHOSPHOR COLOUR DRIVES THE WHOLE SCREEN.',
          title: 'Theme',
        }}
      >
        <div className="flex flex-wrap items-start gap-6">
          <CrtSection
            className="min-w-0 flex-[1_1_460px]"
            contentClassName="flex flex-col gap-[22px] p-5"
            label="#6CC6FF"
            title="PHOSPHOR"
          >
            <CrtFieldset legend="PRESETS">
              <RadioGroup className="flex flex-col gap-2" defaultValue="blue">
                {PRESETS.map(preset => (
                  <CrtOption
                    className="gap-3.5 py-2.5"
                    key={preset.name}
                    sel={preset.selected}
                  >
                    <RadioGroupItem value={preset.name.toLowerCase()} />
                    <span
                      aria-hidden="true"
                      className="h-7 w-10 flex-none"
                      style={{
                        backgroundColor: preset.hex,
                        boxShadow: `0 0 10px ${preset.hex}`,
                      }}
                    />
                    <span className="text-[24px]">{preset.name}</span>
                    <span className="ml-auto text-phosphor-dim">
                      {preset.note}
                    </span>
                  </CrtOption>
                ))}
              </RadioGroup>
            </CrtFieldset>
            <CrtFieldset legend="CUSTOM">
              <div className="flex items-center gap-2">
                <input
                  aria-label="Pick a colour"
                  className="size-11 shrink-0 cursor-pointer appearance-none border border-primary bg-transparent p-1 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
                  defaultValue="#6CC6FF"
                  type="color"
                />
                <label className="flex-none" htmlFor="hex">
                  HEX&gt;
                </label>
                <Input
                  aria-describedby="hex-msg"
                  autoComplete="off"
                  className="max-w-50 uppercase"
                  defaultValue="#6CC6FF"
                  id="hex"
                  spellCheck={false}
                />
              </div>
              <p className="mt-2" id="hex-msg">
                PRESET IN USE
              </p>
            </CrtFieldset>
            <div className="flex flex-wrap gap-2">
              <Button
                className="min-h-13 flex-1 text-[24px]"
                type="button"
                variant="default"
              >
                Apply
              </Button>
              <Button className="min-h-13" type="button" variant="outline">
                Reset to blue
              </Button>
            </div>
          </CrtSection>
        </div>
      </PageLayout>
    </>
  );
}
