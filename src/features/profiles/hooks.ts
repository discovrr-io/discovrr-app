import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { Profile, ProfileId } from '../../models';
import { RootState, useAppDispatch } from '../../store';
import { fetchProfileById, selectProfileById } from './profilesSlice';

export function useProfile(
  profileId: ProfileId,
  reload = false,
): Profile | undefined {
  const $FUNC = '[profiles/hooks/useProfile]';
  const dispatch = useAppDispatch();

  useEffect(() => {
    (async () => {
      try {
        console.log($FUNC, `Fetching profile with id ${profileId}...`);
        await dispatch(fetchProfileById({ profileId, reload })).unwrap();
      } catch (error) {
        if (error.name && error.name === 'ConditionError') {
          console.warn(
            $FUNC,
            'There is already a dispatched action fetching profile with',
            `ID '${profileId}'`,
          );
        } else {
          console.error(
            $FUNC,
            `Failed to fetch profile with id '${profileId}':`,
            error,
          );
        }
      }
    })();
  }, [dispatch, reload, profileId]); // Runs once per hook or when profileId changes

  return useSelector((state: RootState) => selectProfileById(state, profileId));
}
