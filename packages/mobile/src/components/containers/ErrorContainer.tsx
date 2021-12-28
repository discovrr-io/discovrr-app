import React from 'react';

import InfoContainer, { InfoContainerProps } from './InfoContainer';

export type ErrorContainerProps = InfoContainerProps;

export default function ErrorContainer(props: ErrorContainerProps) {
  const {
    emoji = '😳',
    title = 'This is awkward',
    message = 'Something wrong happened. Please try again later.',
    ...restProps
  } = props;

  return (
    <InfoContainer
      emoji={emoji}
      title={title}
      message={message}
      {...restProps}
    />
  );
}
