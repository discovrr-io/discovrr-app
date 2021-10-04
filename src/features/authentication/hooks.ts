import { SerializedError } from '@reduxjs/toolkit';
import { useSelector } from 'react-redux';

import { RootState } from 'src/store';
import { AuthLoadingStatus } from './authSlice';

type AuthState = readonly [AuthLoadingStatus, SerializedError | undefined];

export function useAuthState(): AuthState {
  const { status, error } = useSelector((state: RootState) => state.auth);
  return [status, error] as const;
}
