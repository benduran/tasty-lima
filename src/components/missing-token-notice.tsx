import { Alert, AlertDescription, AlertTitle } from './ui/alert.tsx';

export function MissingTokenNotice() {
  return (
    <div className="flex h-screen items-center justify-center p-6">
      <Alert className="max-w-xl" variant="default">
        <AlertTitle>Access token missing</AlertTitle>
        <AlertDescription>
          Open the link tasty-lima printed in your terminal when it started (it
          ends in <span className="font-mono">#t=...</span>), or restart
          tasty-lima to get a new one.
        </AlertDescription>
      </Alert>
    </div>
  );
}
