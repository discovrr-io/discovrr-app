import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { layout } from 'src/constants';

import Spacer from '../Spacer';
import { CardElementChildRenderer, CardElementProps } from './common';
import { useCardElementOptionsContext } from './hooks';

type CardFooterProps = CardElementProps & {
  children?: CardElementChildRenderer | ReactNode;
};

export default function CardFooter(props: CardFooterProps) {
  const cardElementOptions = useCardElementOptionsContext(props.elementOptions);
  return (
    <View
      style={[
        cardFooterStyles.container,
        {
          paddingHorizontal: cardElementOptions.insetHorizontal,
          paddingBottom: cardElementOptions.insetVertical,
        },
        props.style,
      ]}>
      {React.Children.map(props.children, (child, index) => (
        <>
          {typeof child === 'function' ? child(cardElementOptions) : child}
          {index < React.Children.count(props.children) - 1 && (
            <Spacer.Horizontal value={layout.spacing.md} />
          )}
        </>
      ))}
    </View>
  );
}

const cardFooterStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
