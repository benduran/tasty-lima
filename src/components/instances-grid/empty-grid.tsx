import { TableCell, TableRow } from '../ui/table.tsx';
import { COLS_COUNT } from './constants.ts';

export function EmptyGrid() {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell className="px-3 py-4 text-phosphor-dim" colSpan={COLS_COUNT}>
        There are currently no Lima VMs available
      </TableCell>
    </TableRow>
  );
}
