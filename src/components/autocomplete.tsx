import type { ReactNode } from 'react';
import { useState } from 'react';
import { cn } from '../lib/index.ts';
import type { Nullish } from '../shared/types.ts';
import { isNullOrUndefined } from '../shared/util.ts';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from './ui/combobox.tsx';
import { Skeleton } from './ui/skeleton.tsx';

export type AutocompleteItem<T, M extends object = object> = {
  id: string;
  label: ReactNode;
  metadata?: M;
  value: T;
};

type BaseAutocompleteProps<T, M extends object> = {
  className?: Nullish<string>;
  emptyState?: ReactNode | ((query: string) => ReactNode);
  itemToStringLabel?: (item: AutocompleteItem<T, M>) => string;
  items: AutocompleteItem<T, M>[];
  loading?: boolean;
  placeholder?: string;
};

type AutocompleteProps<T, M extends object> = BaseAutocompleteProps<T, M> &
  (
    | {
        multiple: true;
        onChange: (selected: AutocompleteItem<T, M>[]) => void;
        value: AutocompleteItem<T, M>[];
      }
    | {
        multiple?: never;
        onChange: (selected: AutocompleteItem<T, M> | null) => void;
        value: AutocompleteItem<T, M> | null;
      }
  );

/**
 * this component exists because I'm beyond tired of manually wiring
 * up the pile of verbosity that is Shadcn. I prefer a single component with a slim props interface
 * so I don't have to remember where and how to render a bunch of 3rd party stuffs
 */
export function Autocomplete<T, M extends object>(
  props: AutocompleteProps<T, M>,
) {
  /** state */
  const [query, setQuery] = useState('');

  /** refs */
  const anchorRef = useComboboxAnchor();

  /** helpers */
  const itemToString =
    props.itemToStringLabel ??
    ((item: AutocompleteItem<T, M>) =>
      typeof item.label === 'string' ? item.label : String(item.value));

  return (
    <div className={cn('w-full', props.className)}>
      {props.loading ? (
        <Skeleton className="h-8" />
      ) : (
        <Combobox<AutocompleteItem<T, M>, true | undefined>
          autoHighlight
          filter={(item: AutocompleteItem<T, M>, q: string) => {
            const needle = q.toLowerCase();
            const valueMatch =
              typeof item.value === 'string'
                ? item.value.toLowerCase().includes(needle)
                : false;

            return (
              itemToString(item).toLowerCase().includes(needle) || valueMatch
            );
          }}
          isItemEqualToValue={(
            a: AutocompleteItem<T, M>,
            b: AutocompleteItem<T, M>,
          ) => a.id === b.id}
          items={props.items}
          itemToStringLabel={itemToString}
          multiple={props.multiple}
          onInputValueChange={setQuery}
          onValueChange={(
            val: AutocompleteItem<T, M> | AutocompleteItem<T, M>[] | null,
          ) => {
            if (props.multiple) {
              if (isNullOrUndefined(val)) return props.onChange([]);
              return props.onChange(Array.isArray(val) ? val : [val]);
            }
            if (Array.isArray(val)) return props.onChange(val[0] ?? null);
            return props.onChange(val);
          }}
          value={props.multiple ? props.value : (props.value ?? null)}
        >
          {!props.multiple && (
            <ComboboxInput
              placeholder={props.placeholder ?? 'Type something...'}
            />
          )}
          {props.multiple && (
            <ComboboxChips className="w-full" ref={anchorRef}>
              <ComboboxValue>
                {(values: AutocompleteItem<T, M>[]) => (
                  <>
                    {values.map(v => (
                      <ComboboxChip key={v.id}>{v.label}</ComboboxChip>
                    ))}
                    <ComboboxChipsInput
                      placeholder={props.placeholder ?? 'Type something...'}
                    />
                  </>
                )}
              </ComboboxValue>
            </ComboboxChips>
          )}
          <ComboboxContent>
            <ComboboxEmpty>
              {typeof props.emptyState === 'function'
                ? props.emptyState(query)
                : (props.emptyState ?? 'No items found.')}
            </ComboboxEmpty>
            <ComboboxList>
              {(item: AutocompleteItem<T, M>) => (
                <ComboboxItem key={item.id} value={item}>
                  {item.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      )}
    </div>
  );
}
