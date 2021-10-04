import React, { useContext } from 'react';

import { CellElementContext, renderChildrenWithDivider } from './common';

type CellSelectContextProps = {
  value: string;
  onValueChanged: (value: string) => void | Promise<void>;
  disabled?: boolean;
};

export const CellSelectContext = React.createContext<CellSelectContextProps>(
  null as any,
);

type CellSelectProps = CellSelectContextProps & {
  children?: React.ReactNode;
};

export default function CellSelect(props: CellSelectProps) {
  const { children, ...cellSelectProps } = props;
  const cellElementProps = useContext(CellElementContext);

  return (
    <CellSelectContext.Provider value={cellSelectProps}>
      {renderChildrenWithDivider(children, cellElementProps)}
    </CellSelectContext.Provider>
  );
}
