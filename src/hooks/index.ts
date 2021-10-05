import React, { useContext, useEffect, useRef } from 'react';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { AsyncThunkAction } from '@reduxjs/toolkit';

import { ApiFetchStatus } from 'src/api';
import { AppDispatch, RootState } from 'src/store';

/*

From https://react-redux.js.org/using-react-redux/usage-with-typescript#typing-the-useselector-hook:

  Since these are actual variables, not types, it's important to define them in
  a separate file such as app/hooks.ts, not the store setup file. This allows
  you to import them into any component file that needs to use the hooks, and
  avoids potential circular import dependency issues.

*/

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * A custom hook that determines whether or not this component is mounted.
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

/**
 * A custom hook that determines whether or not this is the initial render of
 * the component.
 */
export function useIsInitialRender(): React.MutableRefObject<boolean> {
  const isInitialRender = useRef(true);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
    }
  }, []);

  return isInitialRender;
}

type AsyncItemSelector<TItemId, TItem> = (
  state: RootState,
  id: TItemId,
) => TItem;

type AsyncItemStatusSelector<TItemId> = (
  state: RootState,
  id: TItemId,
) => ApiFetchStatus;

export type UseAsyncItemReturn<Item, Status = ApiFetchStatus> = readonly [
  Item,
  Status,
];

export interface TypedUseAsyncItem<ItemId, Item, Status = ApiFetchStatus> {
  (itemId: ItemId): UseAsyncItemReturn<Item, Status>;
}

type FetchItemAction<AsyncThunkReturned, AsyncThunkArg> = AsyncThunkAction<
  AsyncThunkReturned,
  AsyncThunkArg,
  Record<string, never>
>;

export function useAsyncItem<ItemId, Item, AsyncThunkReturned, AsyncThunkArg>(
  itemName: string,
  itemId: ItemId,
  fetchItemAction: FetchItemAction<AsyncThunkReturned, AsyncThunkArg>,
  selectItem: AsyncItemSelector<ItemId, Item>,
  selectItemStatus: AsyncItemStatusSelector<ItemId>,
): UseAsyncItemReturn<Item> {
  const $FUNC = '[useAsyncItem]';
  const description = `${itemName} with ID '${itemId}'`;

  const dispatch = useAppDispatch();

  useEffect(
    () => {
      (async () => {
        try {
          console.log($FUNC, `Fetching ${description}...`);
          // NOTE: Native promises don't have cancellation, so we can't return a
          // cleanup function to abort this async action.
          await dispatch(fetchItemAction).unwrap();
          // console.log($FUNC, `Successfully fetched ${description}`);
        } catch (error: any) {
          // "ConditionError" is thrown by redux-thunk when an action is
          // cancelled because it is already running. We'll ignore that error
          // and instead report any other error we get.
          if (error.name !== 'ConditionError') {
            console.error(
              $FUNC,
              `Failed to fetch ${description}:`,
              error.message ?? error,
            );
          }
        }
      })();
    },
    // NOTE: We DO NOT want to re-render when `fetchItemAction` changes. We also
    // don't care if `description` changes since it should never change anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, itemId],
  );

  return [
    useAppSelector(state => selectItem(state, itemId)),
    useAppSelector(state => selectItemStatus(state, itemId)),
  ] as const;
}

export function useOverridableContextOptions<T>(
  context: React.Context<T>,
  overrides?: Partial<T>,
): T {
  const contextOptions = useContext(context);
  return { ...contextOptions, ...overrides };
}
