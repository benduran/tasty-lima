import { AppShell } from './layouts/AppShell.tsx';
import { TastyLimaProviders } from './providers/index.ts';
import { TastyLimaRouter } from './routes/tasty-lima-router.tsx';

export function App() {
  return (
    <TastyLimaProviders>
      <AppShell>
        <TastyLimaRouter />
      </AppShell>
    </TastyLimaProviders>
  );
}
