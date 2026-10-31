import { cn } from '../../lib/utils.ts';
import { Panel } from '../panel.tsx';

export type LibraryItem = {
  name: string;
  selected?: boolean;
  sub: string;
  tags: readonly string[];
};

export type LibraryGroup = {
  items: readonly LibraryItem[];
  label: string;
  where: string;
};

export function TemplateList({
  className,
  groups,
}: {
  className?: string;
  groups: readonly LibraryGroup[];
}) {
  const shown = groups.reduce((sum, group) => sum + group.items.length, 0);
  return (
    <Panel className={className} meta={`${shown} SHOWN`} title="LIBRARY">
      {groups.map(group => (
        <div key={group.label}>
          <p className="flex justify-between gap-3 border-b border-phosphor-line px-3 pt-2.5 pb-1 tracking-[0.08em] text-phosphor-dim">
            <span>{group.label}</span>
            <span>{group.where}</span>
          </p>
          {group.items.map(item => (
            <button
              aria-pressed={item.selected}
              className={cn(
                'grid w-full min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 border-b border-phosphor-line px-3 py-1.5 text-left whitespace-normal hover:bg-phosphor-faint',
                item.selected &&
                  'bg-phosphor-faint text-shadow-(--glow) outline -outline-offset-1 outline-primary',
              )}
              key={item.name}
              type="button"
            >
              <span className="text-[23px] wrap-anywhere">{item.name}</span>
              {item.tags.length > 0 && (
                <span className="flex gap-1.5">
                  {item.tags.map(tag => (
                    <span
                      className="border border-phosphor-dim px-1.25 whitespace-nowrap"
                      key={tag}
                    >
                      {tag}
                    </span>
                  ))}
                </span>
              )}
              <span className="col-span-full text-phosphor-dim wrap-anywhere">
                {item.sub}
              </span>
            </button>
          ))}
        </div>
      ))}
    </Panel>
  );
}
