import { AppShell } from './layouts/AppShell.tsx';
import { TastyLimaProviders } from './providers/index.ts';
import { TastyLimaRouter } from './routes/index.ts';

export function App() {
  return (
    <TastyLimaProviders>
      <AppShell>
        <TastyLimaRouter />
      </AppShell>
    </TastyLimaProviders>
  );
}
