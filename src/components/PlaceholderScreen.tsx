import React from 'react';

import { InfoContainer } from './containers';

export default function PlaceholderScreen() {
  return (
    <InfoContainer
      emoji="🚧"
      title="Under Construction"
      message="We're working on this page at the moment. We'll notify you when it's done!"
    />
  );
}
