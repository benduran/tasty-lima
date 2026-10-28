import { AppFooter } from '@/components/app-footers';
import {
  CrtCells,
  CrtCursor,
  CrtDot,
  CrtFieldset,
  CrtKey,
  CrtOption,
  CrtSection,
} from '@/components/crt';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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

/* Theme: pick the one phosphor colour that drives the whole screen. */
export function ThemeScreen() {
  return (
    <>
      <main className="mx-auto flex w-full max-w-360 flex-1 flex-col gap-6 p-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-6xl">
            THEME
            <CrtCursor />
          </h1>
          <p className="text-phosphor-dim">
            ONE PHOSPHOR COLOUR DRIVES THE WHOLE SCREEN.
          </p>
        </div>

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

          <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-6">
            <CrtSection
              contentClassName="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-4 p-5"
              title="LEGIBILITY"
            >
              <div className="flex flex-col gap-1">
                <span className="tracking-[0.08em] text-phosphor-dim">
                  TEXT ON SCREEN
                </span>
                <span className="text-[44px] leading-none">10.5:1</span>
                <span className="self-start">
                  <CrtKey>PASS</CrtKey>
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="tracking-[0.08em] text-phosphor-dim">
                  MUTED LABELS
                </span>
                <span className="text-[44px] leading-none text-phosphor-dim">
                  6.4:1
                </span>
                <span className="self-start">
                  <CrtKey>PASS</CrtKey>
                </span>
              </div>
              <p className="col-span-full text-phosphor-dim">
                Muted labels stay readable at 4.5:1 or better.
              </p>
            </CrtSection>

            <CrtSection
              contentClassName="grid grid-cols-[repeat(5,minmax(0,1fr))] gap-2 p-5"
              title="DERIVED SHADES"
            >
              {SHADES.map(shade => (
                <div className="flex flex-col gap-1.5" key={shade.label}>
                  <span className={`h-14 ${shade.cls}`} />
                  <span>{shade.label}</span>
                </div>
              ))}
            </CrtSection>

            <CrtSection
              contentClassName="flex flex-col gap-3.5 p-5"
              title="SAMPLE"
            >
              <div className="grid grid-cols-[20px_minmax(0,1fr)_auto_auto] items-center gap-3 bg-phosphor-faint px-3 py-2.5 outline -outline-offset-1 outline-primary">
                <CrtDot variant="run" />
                <span className="text-[23px]">default</span>
                <span>RUNNING</span>
                <CrtCells on={4} total={6} />
              </div>
              <p>
                <span className="text-phosphor-dim">10-21 10:44:09</span>{' '}
                <span className="px-1 outline-1 -outline-offset-1">WARN</span>{' '}
                failed to set up forwarding tcp port 5432
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="default">
                  Start
                </Button>
                <Button type="button" variant="outline">
                  Logs
                </Button>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </div>
            </CrtSection>
          </div>
        </div>
      </main>
      <AppFooter
        keys={[
          ['1-4', 'PRESET'],
          ['ENTER', 'APPLY'],
          ['ESC', 'BACK'],
        ]}
        note="phosphor #6CC6FF"
      />
    </>
  );
}
