import { cn } from '../lib/utils.ts';
import { Input } from './ui/input.tsx';

export function PromptSearch({
  className,
  htmlFor,
  placeholder,
  prompt,
}: {
  className?: string;
  htmlFor: string;
  placeholder?: string;
  prompt: string;
}) {
  return (
    <label
      className={cn(
        'flex max-w-95 flex-1 basis-65 items-center gap-2.5',
        className,
      )}
      htmlFor={htmlFor}
    >
      <span>{prompt}</span>
      <Input
        id={htmlFor}
        placeholder={placeholder}
        spellCheck={false}
        type="search"
      />
    </label>
  );
}
