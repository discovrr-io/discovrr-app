import React from 'react';

import { ApiFetchStatus } from 'src/api';
import { UseAsyncItemReturn } from 'src/hooks';

type AsyncGateProps<Item, Status extends ApiFetchStatus> = {
  data: UseAsyncItemReturn<Item, Status>;
  onPending?: () => React.ReactNode;
  onFulfilled?: (data: Item) => React.ReactNode;
  onRejected?: (error: Status['error']) => React.ReactNode;
};

export default function AsyncGate<Item, Status extends ApiFetchStatus>({
  data,
  onPending: renderPending,
  onFulfilled: renderFulfilled,
  onRejected: renderRejected,
}: AsyncGateProps<Item, Status>) {
  const $FUNC = '[AsyncGate]';
  const [item, { status, error }] = data;
  if (status === 'rejected' || !!error) {
    console.error($FUNC, 'Failed to resolve item:', error);
    return <>{renderRejected?.(error)}</>;
  } else if (status === 'pending') {
    return <>{renderPending?.()}</>;
  } else {
    return <>{renderFulfilled?.(item)}</>;
  }
}
