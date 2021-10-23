import React, { useContext } from 'react';

import { CellElementContext, renderChildrenWithDivider } from './common';

type CellInputGroupContextProps = {
  labelFlex: number;
  inputFlex: number;
};

const defaultCellInputGroupContextProps: CellInputGroupContextProps = {
  labelFlex: 1,
  inputFlex: 3,
};

export const CellInputGroupContext =
  React.createContext<CellInputGroupContextProps>(
    defaultCellInputGroupContextProps,
  );

type CellInputGroupProps = Partial<CellInputGroupContextProps> & {
  children?: React.ReactNode;
};

export default function CellInputGroup(props: CellInputGroupProps) {
  const cellElementOptions = useContext(CellElementContext);

  const { children, ...partialCellInputGroupProps } = props;
  const cellInputGroupProps = {
    ...defaultCellInputGroupContextProps,
    ...partialCellInputGroupProps,
  };

  return (
    <CellInputGroupContext.Provider value={cellInputGroupProps}>
      {renderChildrenWithDivider(children, cellElementOptions)}
    </CellInputGroupContext.Provider>
  );
}
