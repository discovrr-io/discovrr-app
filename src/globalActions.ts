import { createAction, nanoid } from '@reduxjs/toolkit';

type ResetAppStateParams = {
  shouldResetFCMRegistrationToken?: boolean;
};

const RESET_APP_STATE = 'discovrr-app/reset-app-state';

export const resetAppState = createAction(
  RESET_APP_STATE,
  (params: ResetAppStateParams = {}) => {
    return {
      payload: {
        id: nanoid(),
        ...params,
      },
    };
  },
);
