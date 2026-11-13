import { type ComponentProps, type ReactNode, useState } from 'react';
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
  /** state */
  const [open, setOpen] = useState(false);

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger render={<Button {...rest} />} />
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>{confirmTitle}</PopoverTitle>
          <PopoverDescription>{confirmMessage}</PopoverDescription>
        </PopoverHeader>
        {/*
          Lives outside PopoverDescription (a <p>) — block content can't
          nest inside it.
        */}
        <div className="flex items-center justify-end gap-2">
          <Button
            onClick={() => {
              setOpen(false);
              onCancel?.();
            }}
            size="sm"
            variant="outline"
          >
            {cancelButtonText}
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
            size="sm"
          >
            {confirmButtonText}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
