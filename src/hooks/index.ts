import React, { useEffect, useRef } from 'react';

/**
 * A custom hook that determines whether or not the enclosing component is
 * mounted, and thus if its state can still be changed.
 *
 * This is useful when you want to check if you can still mutate a stateful
 * value after awaiting an asynchronous task in a possibly unmounted component.
 * This specifically avoids the `"Can't perform a React state update on an
 * unmounted component"` error.
 *
 * @returns Whether or not the current component is still mounted.
 */
export function useIsMounted(): React.MutableRefObject<boolean> {
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return isMounted;
}

export function useIsInitialRender(): React.MutableRefObject<boolean> {
  const isInitialRender = useRef(true);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
    }
  }, []);

  return isInitialRender;
}
