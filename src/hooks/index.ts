import React, { useEffect, useRef } from 'react';

/**
 * A custom hook that determines whether or not the enclosing component is
 * mounted.
 *
 * This is useful when you want to check if you can mutate a stateful value
 * after dispatching an action that may unmount the enclosing component. This
 * specifically avoids the `"Can't perform a React state update on an
 * unmounted component"` error you may see.
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
