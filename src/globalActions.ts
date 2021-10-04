import { createAction } from '@reduxjs/toolkit';

const RESET_APP_STATE = 'discovrr-app/reset-app-state';
export const resetAppState = createAction(RESET_APP_STATE);
