import CellButton from './CellButton';
import CellField from './CellField';
import CellGroup from './CellGroup';
import CellInput from './CellInput';
import CellInputGroup from './CellInputGroup';
import CellNavigator from './CellNavigator';
import CellOption from './CellOption';
import CellSelect from './CellSelect';
import CellSwitch from './CellSwitch';

export type { CellButtonProps } from './CellButton';
export type { CellFieldProps } from './CellField';
export type { CellGroupProps } from './CellGroup';
export type { CellInputProps } from './CellInput';
export type { CellInputGroupProps } from './CellInputGroup';
export type { CellNavigatorProps } from './CellNavigator';
export type { CellOptionProps } from './CellOption';
export type { CellSelectProps } from './CellSelect';
export type { CellSwitchProps } from './CellSwitch';

const Cell = {
  Button: CellButton,
  Field: CellField,
  Group: CellGroup,
  Input: CellInput,
  InputGroup: CellInputGroup,
  Navigator: CellNavigator,
  Option: CellOption,
  Select: CellSelect,
  Switch: CellSwitch,
};

export default Cell;
