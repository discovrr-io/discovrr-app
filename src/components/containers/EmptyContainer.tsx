import React from 'react';

import InfoContainer, { InfoContainerProps } from './InfoContainer';

type EmptyContainerProps = InfoContainerProps;

export default function EmptyContainer(props: EmptyContainerProps) {
  const {
    emoji = '🤔',
    title = "It's quiet here",
    message = "There doesn't seem to be anything here at the moment.",
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
