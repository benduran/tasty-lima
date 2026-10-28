import { AppShell } from './layouts/AppShell';
import { TastyLimaProviders } from './providers';
import { TastyLimaRouter } from './routes/tasty-lima-router';

export function App() {
  return (
    <TastyLimaProviders>
      <AppShell>
        <TastyLimaRouter />
      </AppShell>
    </TastyLimaProviders>
  );
}
