import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';

import { CardElementProps, CardElementChildRenderer } from './common';
import { useCardElementOptionsContext } from './hooks';

type CardBodyProps = CardElementProps & {
  disabled?: TouchableOpacityProps['disabled'];
  onPress?: TouchableOpacityProps['onPress'];
  children?: CardElementChildRenderer | React.ReactNode;
};

export default function CardBody(props: CardBodyProps) {
  const cardElementOptions = useCardElementOptionsContext(props.elementOptions);

  return (
    <TouchableOpacity activeOpacity={1} onPress={props.onPress}>
      <>
        {typeof props.children === 'function'
          ? props.children(cardElementOptions)
          : props.children}
      </>
    </TouchableOpacity>
  );
}
