import { useRef } from 'react';
import { CrtFieldset, CrtOption, CrtSection } from '../components/crt.tsx';
import { Input } from '../components/ui/input.tsx';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group.tsx';
import { PageLayout } from '../layouts/PageLayout.tsx';
import {
  ColorHexSchema,
  PRESET_THEMES,
  useThemeStore,
} from '../stores/theme-store.ts';

export function ThemePage() {
  /** refs */
  const colorInputRef = useRef<HTMLInputElement>(null);

  /** store */
  const [color, setColor] = useThemeStore('color');

  const lowerColor = color?.toLowerCase() || '';

  return (
    <>
      <PageLayout
        subheader={{
          title: 'Theme',
        }}
      >
        <div className="flex flex-wrap items-start gap-6">
          <CrtSection
            className="min-w-0 flex-[1_1_460px]"
            contentClassName="flex flex-col gap-[22px] p-5"
          >
            <CrtFieldset legend="PRESETS">
              <RadioGroup
                className="flex flex-col gap-2"
                onValueChange={newHex => {
                  const validated = ColorHexSchema.safeParse(newHex);
                  if (validated.success) setColor(validated.data);
                }}
                value={lowerColor}
              >
                {Object.entries(PRESET_THEMES).map(([name, hex]) => {
                  const lowerHex = hex.toLowerCase();
                  return (
                    <CrtOption
                      className="gap-3.5 py-2.5"
                      key={name}
                      sel={lowerColor === lowerHex}
                    >
                      <RadioGroupItem value={lowerHex} />
                      <span
                        aria-hidden="true"
                        className="h-7 w-10 flex-none"
                        style={{
                          backgroundColor: hex,
                          boxShadow: `0 0 10px ${lowerHex}`,
                        }}
                      />
                      <span className="text-[24px] uppercase">{name}</span>
                    </CrtOption>
                  );
                })}
              </RadioGroup>
            </CrtFieldset>
            <CrtFieldset legend="CUSTOM">
              <div className="flex items-center gap-2">
                <input
                  aria-label="Pick a colour"
                  className="size-11 shrink-0 cursor-pointer appearance-none border border-primary bg-transparent p-1 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
                  onChange={e => {
                    const validated = ColorHexSchema.safeParse(
                      e.currentTarget.value,
                    );
                    if (validated.success) setColor(validated.data);
                  }}
                  ref={colorInputRef}
                  type="color"
                  value={color || PRESET_THEMES.blue}
                />
                <label className="flex-none" htmlFor="hex">
                  HEX&gt;
                </label>
                <Input
                  aria-describedby="hex-msg"
                  autoComplete="off"
                  className="max-w-50 uppercase"
                  id="hex"
                  onFocus={() => {
                    colorInputRef.current?.click();
                  }}
                  readOnly
                  spellCheck={false}
                  value={color || PRESET_THEMES.blue}
                />
              </div>
            </CrtFieldset>
          </CrtSection>
        </div>
      </PageLayout>
    </>
  );
}
