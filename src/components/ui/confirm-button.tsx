import type { ComponentProps, ReactNode } from 'react';
import { Button } from './button.tsx';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from './popover.tsx';

export type ConfirmButtonProps = ComponentProps<typeof Button> & {
  cancelButtonText?: ReactNode;
  confirmButtonText?: ReactNode;
  confirmMessage: ReactNode;
  confirmTitle?: ReactNode;
  onCancel?: () => void;
  onConfirm: () => void;
};

export function ConfirmButton({
  cancelButtonText = 'Cancel',
  confirmButtonText = 'Confirm',
  confirmMessage,
  confirmTitle = 'Confirm',
  onCancel,
  onConfirm,
  ...rest
}: ConfirmButtonProps) {
  return (
    <Popover>
      <PopoverTrigger render={<Button {...rest} />} />
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>{confirmTitle}</PopoverTitle>
          <PopoverDescription>
            <div className="flex flex-col gap-2">
              <div>{confirmMessage}</div>
              <div className="flex items-center justify-end gap-2">
                <Button size="sm" variant="outline">
                  {cancelButtonText}
                </Button>
                <Button size="sm">{confirmButtonText}</Button>
              </div>
            </div>
          </PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  );
}
