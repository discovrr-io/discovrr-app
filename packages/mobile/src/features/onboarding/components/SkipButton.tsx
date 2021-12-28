import * as React from 'react';

import * as constants from 'src/constants';
import { Button, ButtonProps } from 'src/components';

type SkipButtonProps = Omit<
  ButtonProps,
  'title' | 'size' | 'textStyle' | 'containerStyle'
> & {
  title?: string;
};

export default function SkipButton(props: SkipButtonProps) {
  return (
    <Button
      {...props}
      title={props.title || 'Not Now'}
      size="medium"
      textStyle={{ textAlign: 'right' }}
      innerTextProps={{
        allowFontScaling: false,
      }}
      containerStyle={{
        flex: 1,
        alignItems: 'flex-end',
        paddingHorizontal: 0,
        marginRight: constants.layout.defaultScreenMargins.horizontal,
      }}
    />
  );
}
