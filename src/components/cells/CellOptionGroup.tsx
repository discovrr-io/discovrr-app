import React, { useContext } from 'react';

import { CellElementContext, renderChildrenWithDivider } from './common';

type CellOptionGroupContextProps = {
  value: string;
  onValueChanged: (value: string) => void | Promise<void>;
  disabled?: boolean;
};

export const CellOptionGroupContext =
  React.createContext<CellOptionGroupContextProps>(null as any);

export type CellOptionGroupProps = CellOptionGroupContextProps & {
  children?: React.ReactNode;
};

export default function CellOptionGroup(props: CellOptionGroupProps) {
  const { children, ...cellSelectProps } = props;
  const cellElementProps = useContext(CellElementContext);

  return (
    <CellOptionGroupContext.Provider value={cellSelectProps}>
      {renderChildrenWithDivider(children, cellElementProps)}
    </CellOptionGroupContext.Provider>
  );
}
