'use client';

import {
  Dispatch,
  SetStateAction,
  createContext,
  use,
} from 'react';
import { AdminData } from '@/admin/actions';

export type AppStateContextType = {
  // CORE
  previousPathname?: string
  hasLoaded?: boolean
  setHasLoaded?: Dispatch<SetStateAction<boolean>>
  swrTimestamp?: number
  invalidateSwr?: () => void
  shouldRespondToKeyboardCommands?: boolean
  setShouldRespondToKeyboardCommands?: Dispatch<SetStateAction<boolean>>
  // AUTH
  userEmail?: string
  userEmailEager?: string
  setUserEmail?: Dispatch<SetStateAction<string | undefined>>
  isUserSignedIn?: boolean
  isUserSignedInEager?: boolean
  clearAuthStateAndRedirectIfNecessary?: () => void
  // ADMIN
  isCheckingAuth?: boolean
  adminUpdateTimes?: Date[]
  registerAdminUpdate?: () => void
  hasAdminData?: boolean
  isLoadingAdminData?: boolean
  refreshAdminData?: () => void
  updateAdminData?: (updatedData: Partial<AdminData>) => void
} & Partial<AdminData>

export const AppStateContext = createContext<AppStateContextType>({});

export const useAppState = () => use(AppStateContext);
