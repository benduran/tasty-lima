import { COLS_COUNT } from './constants.ts';

export function EmptyGrid() {
  return (
    <span style={{ gridColumn: `2 / ${COLS_COUNT + 1}` }}>
      There are currently no Lima VMs available
    </span>
  );
}
