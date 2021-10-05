import { createAction } from '@reduxjs/toolkit';

// TODO: Add parameter to signify if authentication should be reset
const RESET_APP_STATE = 'discovrr-app/reset-app-state';
export const resetAppState = createAction(RESET_APP_STATE);
