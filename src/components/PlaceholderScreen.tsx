import * as React from 'react';

import InfoContainer, { InfoContainerProps } from './containers/InfoContainer';

export default function PlaceholderScreen(props: InfoContainerProps) {
  return (
    <InfoContainer
      emoji="🚧"
      title="Under Construction"
      message="We're working on this page at the moment."
      {...props}
    />
  );
}
