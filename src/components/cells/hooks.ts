import { useOverridableContextOptions } from 'src/hooks';
import { CellElementContext, CellElementProps } from './common';

export function useCellElementContext(
  overrides: CellElementProps['elementOptions'],
) {
  return useOverridableContextOptions(CellElementContext, overrides);
}
